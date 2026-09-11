/**
 * Step 14 Verification Test Suite
 * Custom Template Editor & Notification Automation Rules
 *
 * Tests:
 * 1. Variable Resolution Engine (resolveVariable & buildDynamicTemplate)
 * 2. Automation Controller API: GET /api/automations/:storeId (Seeds defaults & checks auth)
 * 3. Automation Controller API: PUT /api/automations/:storeId/rule (Single rule upsert)
 * 4. Automation Controller API: PUT /api/automations/:storeId/batch (Batch rules upsert)
 * 5. Worker Dynamic Template Dispatching (Custom templateName, languageCode, variableMap)
 * 6. Worker Disabled Automation Skipping (isEnabled: false skips Meta API dispatch)
 */

import assert from 'node:assert';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import prisma from '../src/db/prisma.js';
import config from '../src/config/env.js';
import {
  resolveVariable,
  buildDynamicTemplate,
  getNotificationRule,
} from '../src/utils/templateMapper.js';
import { processWebhookJob } from '../src/workers/webhookWorker.js';

const app = createApp();
const request = supertest(app);

async function runAutomationTests() {
  console.log('🧪 Starting Step 14 Verification Test Suite (Custom Template Editor & Automation Rules)...\n');

  let testUser = null;
  let testStore = null;
  let otherUser = null;
  let merchantToken = null;
  let otherToken = null;

  try {
    // 0. Setup Merchant & Store
    testUser = await prisma.user.create({
      data: {
        email: `automation.merchant.${Date.now()}@example.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        plan: 'PRO',
        subscriptionStatus: 'ACTIVE',
      },
    });

    otherUser = await prisma.user.create({
      data: {
        email: `unauthorized.merchant.${Date.now()}@example.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        plan: 'FREE',
      },
    });

    testStore = await prisma.store.create({
      data: {
        userId: testUser.id,
        platform: 'SHOPIFY',
        storeUrl: `automation-store-${Date.now()}.myshopify.com`,
        accessToken: 'shpat_test_automation_token',
        webhookSecret: 'secret_auto_123',
      },
    });

    merchantToken = jwt.sign(
      { id: testUser.id, email: testUser.email, subscriptionStatus: testUser.subscriptionStatus },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    otherToken = jwt.sign(
      { id: otherUser.id, email: otherUser.email },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // =========================================================================
    // Test 1: Dynamic Variable Resolution Engine
    // =========================================================================
    console.log('1️⃣ Testing Variable Resolution Engine (resolveVariable & buildDynamicTemplate) ...');
    const mockContext = {
      customer: {
        customerName: 'Priya Patel',
        normalizedPhone: '919876543210',
        orderNumber: '#ORD-9901',
        formattedTotal: 'INR 2499.00',
        currency: 'INR',
      },
      payload: {
        id: 9901,
        shipping_address: { first_name: 'Priya', last_name: 'Patel' },
        tracking_number: 'TRK12345678',
      },
      store: {
        storeUrl: 'fashion-hub.myshopify.com',
      },
    };

    assert.strictEqual(resolveVariable('customer.name', mockContext), 'Priya Patel');
    assert.strictEqual(resolveVariable('customer.first_name', mockContext), 'Priya');
    assert.strictEqual(resolveVariable('order.number', mockContext), '#ORD-9901');
    assert.strictEqual(resolveVariable('order.total', mockContext), 'INR 2499.00');
    assert.strictEqual(resolveVariable('store.name', mockContext), 'fashion-hub');
    assert.strictEqual(resolveVariable('tracking_number', mockContext), 'TRK12345678');

    const customRule = {
      templateName: 'custom_order_alert',
      languageCode: 'hi',
      variableMap: {
        '1': 'customer.first_name',
        '2': 'order.number',
        '3': 'order.total',
        '4': 'store.name',
      },
    };

    const builtTemplate = buildDynamicTemplate(customRule, mockContext.customer, mockContext.payload, mockContext.store);
    assert.strictEqual(builtTemplate.templateName, 'custom_order_alert');
    assert.strictEqual(builtTemplate.languageCode, 'hi');
    assert.strictEqual(builtTemplate.parameters.length, 4);
    assert.strictEqual(builtTemplate.parameters[0], 'Priya');
    assert.strictEqual(builtTemplate.parameters[1], '#ORD-9901');
    assert.strictEqual(builtTemplate.parameters[2], 'INR 2499.00');
    assert.strictEqual(builtTemplate.parameters[3], 'fashion-hub');
    console.log('   ✅ Dynamic variable resolution correctly binds nested parameters and custom templates\n');

    // =========================================================================
    // Test 2: Automation Controller API - GET /api/automations/:storeId
    // =========================================================================
    console.log('2️⃣ Testing Automation Controller API (GET /api/automations/:storeId) ...');
    // Unauthorized access should fail (401)
    await request.get(`/api/automations/${testStore.id}`).expect(401);

    // Cross-user access should be rejected (404 or forbidden)
    await request
      .get(`/api/automations/${testStore.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    // Valid merchant should receive seeded default rules
    const getRes = await request
      .get(`/api/automations/${testStore.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    assert.strictEqual(getRes.body.success, true);
    assert.ok(Array.isArray(getRes.body.rules));
    assert.strictEqual(getRes.body.rules.length, 4);

    const triggerEvents = getRes.body.rules.map((r) => r.triggerEvent);
    assert.ok(triggerEvents.includes('ORDER_CREATED'));
    assert.ok(triggerEvents.includes('COD_VERIFICATION'));
    assert.ok(triggerEvents.includes('ABANDONED_CHECKOUT'));
    assert.ok(triggerEvents.includes('ORDER_FULFILLED'));
    console.log('   ✅ GET /api/automations/:storeId securely validates ownership and initializes 4 default rules\n');

    // =========================================================================
    // Test 3: Automation Controller API - PUT /api/automations/:storeId/rule
    // =========================================================================
    console.log('3️⃣ Testing Single Rule Update (PUT /api/automations/:storeId/rule) ...');
    const updatePayload = {
      triggerEvent: 'ORDER_CREATED',
      isEnabled: true,
      templateName: 'vip_order_confirmation',
      languageCode: 'es',
      variableMap: {
        '1': 'customer.first_name',
        '2': 'order.total',
      },
    };

    const putRes = await request
      .put(`/api/automations/${testStore.id}/rule`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send(updatePayload)
      .expect(200);

    assert.strictEqual(putRes.body.success, true);
    assert.strictEqual(putRes.body.rule.templateName, 'vip_order_confirmation');
    assert.strictEqual(putRes.body.rule.languageCode, 'es');
    assert.strictEqual(putRes.body.rule.variableMap['1'], 'customer.first_name');

    // Verify DB persistence
    const savedInDb = await prisma.notificationRule.findUnique({
      where: {
        storeId_triggerEvent: {
          storeId: testStore.id,
          triggerEvent: 'ORDER_CREATED',
        },
      },
    });
    assert.strictEqual(savedInDb.templateName, 'vip_order_confirmation');
    assert.strictEqual(savedInDb.languageCode, 'es');
    console.log('   ✅ PUT /api/automations/:storeId/rule successfully updated single rule in PostgreSQL\n');

    // =========================================================================
    // Test 4: Automation Controller API - PUT /api/automations/:storeId/batch
    // =========================================================================
    console.log('4️⃣ Testing Batch Rules Update (PUT /api/automations/:storeId/batch) ...');
    const batchPayload = {
      rules: [
        {
          triggerEvent: 'ABANDONED_CHECKOUT',
          isEnabled: true,
          templateName: 'flash_sale_recovery',
          languageCode: 'en',
          variableMap: { '1': 'customer.name', '2': 'order.total' },
        },
        {
          triggerEvent: 'ORDER_FULFILLED',
          isEnabled: true,
          templateName: 'express_delivery_alert',
          languageCode: 'en',
          variableMap: { '1': 'customer.name', '2': 'order.number' },
        },
      ],
    };

    const batchRes = await request
      .put(`/api/automations/${testStore.id}/batch`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send(batchPayload)
      .expect(200);

    assert.strictEqual(batchRes.body.success, true);
    assert.strictEqual(batchRes.body.rules.length, 2);
    console.log('   ✅ PUT /api/automations/:storeId/batch successfully applied batch updates\n');

    // =========================================================================
    // Test 5: Worker Dynamic Template Dispatching
    // =========================================================================
    console.log('5️⃣ Testing Webhook Worker Dynamic Template Dispatching ...');
    const originalFetch = globalThis.fetch;
    let dispatchedPayload = null;

    globalThis.fetch = async (url, options) => {
      if (typeof url === 'string' && url.includes('graph.facebook.com')) {
        dispatchedPayload = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            messaging_product: 'whatsapp',
            contacts: [{ input: '15551234567', wa_id: '15551234567' }],
            messages: [{ id: `wamid.DYNAMIC_TEMPLATE_${Date.now()}` }],
          }),
        };
      }
      return originalFetch(url, options);
    };

    let workerResult;
    try {
      const mockOrderJob = {
        id: `job_order_${Date.now()}`,
        data: {
          storeId: testStore.id,
          platform: 'SHOPIFY',
          topic: 'orders/create',
          payload: {
            id: 555123,
            order_number: 555123,
            total_price: '79.99',
            currency: 'USD',
            financial_status: 'paid',
            gateway: 'stripe',
            customer: { first_name: 'Rohit', last_name: 'Verma' },
            shipping_address: { phone: '+15551234567', first_name: 'Rohit' },
          },
        },
      };

      workerResult = await processWebhookJob(mockOrderJob);
    } finally {
      globalThis.fetch = originalFetch;
    }

    assert.strictEqual(workerResult.success, true);
    assert.strictEqual(workerResult.templateName, 'vip_order_confirmation');
    assert.ok(workerResult.messageId);

    // Verify intercepted Meta Cloud API payload matches custom rule configs
    assert.ok(dispatchedPayload, 'Expected Meta API fetch to be invoked');
    assert.strictEqual(dispatchedPayload.template.name, 'vip_order_confirmation');
    assert.strictEqual(dispatchedPayload.template.language.code, 'es');
    assert.strictEqual(dispatchedPayload.template.components[0].parameters[0].text, 'Rohit');
    assert.strictEqual(dispatchedPayload.template.components[0].parameters[1].text, 'USD 79.99');

    const logRecord = await prisma.messageLog.findUnique({
      where: { id: workerResult.messageLogId },
    });
    assert.strictEqual(logRecord.status, 'SENT');
    assert.strictEqual(logRecord.metadata.templateName, 'vip_order_confirmation');
    console.log('   ✅ Webhook Worker dispatched custom template name ("vip_order_confirmation") per configured rule\n');

    // =========================================================================
    // Test 6: Worker Disabled Automation Skipping
    // =========================================================================
    console.log('6️⃣ Testing Webhook Worker Skipping Disabled Automation ...');
    // Disable ORDER_CREATED rule
    await prisma.notificationRule.update({
      where: {
        storeId_triggerEvent: {
          storeId: testStore.id,
          triggerEvent: 'ORDER_CREATED',
        },
      },
      data: { isEnabled: false },
    });

    const disabledJob = {
      id: `job_disabled_${Date.now()}`,
      data: {
        storeId: testStore.id,
        platform: 'SHOPIFY',
        topic: 'orders/create',
        payload: {
          id: 555124,
          order_number: 555124,
          total_price: '49.99',
          financial_status: 'paid',
          gateway: 'paypal',
          shipping_address: { phone: '+15551234567', first_name: 'Anya' },
        },
      },
    };

    const disabledResult = await processWebhookJob(disabledJob);
    assert.strictEqual(disabledResult.success, true);
    assert.strictEqual(disabledResult.skipped, true);
    assert.strictEqual(disabledResult.reason, 'AUTOMATION_DISABLED');

    const skippedLog = await prisma.messageLog.findUnique({
      where: { id: disabledResult.messageLogId },
    });
    assert.strictEqual(skippedLog.metadata.skipped, true);
    assert.strictEqual(skippedLog.metadata.reason, 'AUTOMATION_DISABLED');
    console.log('   ✅ Webhook Worker successfully skipped dispatch when automation rule is disabled (isEnabled: false)\n');

    console.log('🎉 ALL 6 STEP 14 AUTOMATION & TEMPLATE EDITOR TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    // Cleanup test artifacts
    if (testStore) {
      await prisma.notificationRule.deleteMany({ where: { storeId: testStore.id } });
      await prisma.orderVerification.deleteMany({ where: { storeId: testStore.id } });
      await prisma.messageLog.deleteMany({ where: { storeId: testStore.id } });
      await prisma.store.delete({ where: { id: testStore.id } });
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    if (otherUser) {
      await prisma.user.delete({ where: { id: otherUser.id } });
    }
    await prisma.$disconnect();
  }
}

runAutomationTests()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Step 14 Automation Test Suite Failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
