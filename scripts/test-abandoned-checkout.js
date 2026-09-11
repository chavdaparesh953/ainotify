/**
 * Step 15 Verification Test Suite
 * Abandoned Checkout Recovery Sequence Engine
 *
 * Tests:
 * 1. BullMQ Delayed Queueing: 30-minute delay on checkouts/create and checkouts/update
 * 2. Tracked Recovery Links: Dynamic template mapping for checkout.abandoned_checkout_url
 * 3. Deduplication / Organic Conversion Check: Skips dispatch when recent order exists (RECOVERED_ORGANICALLY)
 * 4. Recovery Message Dispatch: Dispatches template message with recovery link when unconverted
 * 5. Dashboard Analytics API: GET /api/dashboard/stats calculates recoveredCheckouts & recoveredOrganically
 * 6. Automation Rules Integration: Respects disabled status (isEnabled: false) for ABANDONED_CHECKOUT
 */

import assert from 'node:assert';
import crypto from 'node:crypto';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import prisma from '../src/db/prisma.js';
import config from '../src/config/env.js';
import {
  resolveVariable,
  buildDynamicTemplate,
  extractCustomerData,
} from '../src/utils/templateMapper.js';
import {
  processWebhookJob,
  checkRecentOrderForCustomer,
} from '../src/workers/webhookWorker.js';

const app = createApp();
const request = supertest(app);

function computeHmac(secret, body) {
  return crypto.createHmac('sha256', secret).update(body).digest('base64');
}

async function runAbandonedCheckoutTests() {
  console.log('🧪 Starting Step 15 Verification Test Suite (Abandoned Checkout Recovery Sequence)...\n');

  let testUser = null;
  let testStore = null;
  let merchantToken = null;

  try {
    // 0. Setup Merchant & Store
    const uniqueSuffix = Date.now();
    testUser = await prisma.user.create({
      data: {
        email: `merchant-abandoned-${uniqueSuffix}@test.com`,
        passwordHash: 'hashed_pw_test',
        plan: 'PRO',
        subscriptionStatus: 'ACTIVE',
      },
    });

    merchantToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    testStore = await prisma.store.create({
      data: {
        userId: testUser.id,
        platform: 'SHOPIFY',
        storeUrl: `abandoned-store-${uniqueSuffix}.myshopify.com`,
        accessToken: 'shpat_test_checkout_token',
        webhookSecret: 'secret_abandoned_123',
      },
    });

    // =========================================================================
    // Test 1: BullMQ Delayed Queueing (30-minute default + test override)
    // =========================================================================
    console.log('1️⃣ Testing BullMQ Delayed Queueing for Checkouts (POST /api/webhooks/receive) ...');
    {
      const checkoutPayload = {
        id: 9911001,
        cart_token: 'cart_tok_abc_123',
        token: 'chk_tok_abc_123',
        email: 'shopper@example.com',
        phone: '+15551234567',
        total_price: '129.50',
        currency: 'USD',
        abandoned_checkout_url: 'https://abandoned-store.myshopify.com/checkout/9911001/recover?key=abc',
        customer: {
          first_name: 'Sophia',
          last_name: 'Chen',
          email: 'shopper@example.com',
        },
      };

      // 1a. Default 30-minute delay
      const rawDefault = JSON.stringify(checkoutPayload);
      const hmacDefault = computeHmac(testStore.webhookSecret, rawDefault);

      const resDefault = await request
        .post('/api/webhooks/receive')
        .set('Content-Type', 'application/json')
        .set('x-shopify-shop-domain', testStore.storeUrl)
        .set('x-shopify-topic', 'checkouts/create')
        .set('x-shopify-hmac-sha256', hmacDefault)
        .send(rawDefault)
        .expect(200);

      assert.strictEqual(resDefault.body.success, true);
      assert.strictEqual(resDefault.body.isDelayed, true);
      assert.strictEqual(resDefault.body.delayMs, 30 * 60 * 1000);
      assert.ok(resDefault.body.message.includes('30m delay'));

      // 1b. Test delay override via headers or payload
      const rawOverride = JSON.stringify(checkoutPayload);
      const hmacOverride = computeHmac(testStore.webhookSecret, rawOverride);

      const resOverride = await request
        .post('/api/webhooks/receive')
        .set('Content-Type', 'application/json')
        .set('x-shopify-shop-domain', testStore.storeUrl)
        .set('x-shopify-topic', 'checkouts/update')
        .set('x-shopify-hmac-sha256', hmacOverride)
        .set('x-test-delay-ms', '250')
        .send(rawOverride)
        .expect(200);

      assert.strictEqual(resOverride.body.success, true);
      assert.strictEqual(resOverride.body.isDelayed, true);
      assert.strictEqual(resOverride.body.delayMs, 250);

      console.log('   ✅ checkouts/create and checkouts/update automatically enqueued with 30-minute delay ({ delay: 30 * 60 * 1000 })\n');
    }

    // =========================================================================
    // Test 2: Tracked Recovery Links & Variable Resolution Engine
    // =========================================================================
    console.log('2️⃣ Testing Tracked Recovery Link Resolution & Dynamic Template Mapping ...');
    {
      const rawPayload = {
        id: 9911002,
        email: 'alex.shopper@example.com',
        abandoned_checkout_url: 'https://shop.example.com/checkouts/c/9911002/recover?utm_source=wanotify',
        total_price: '89.99',
        currency: 'USD',
        customer: { first_name: 'Alex', last_name: 'Morgan' },
        shipping_address: { phone: '+15559876543' },
      };

      const customer = extractCustomerData(rawPayload, 'SHOPIFY');
      assert.strictEqual(customer.checkoutUrl, 'https://shop.example.com/checkouts/c/9911002/recover?utm_source=wanotify');
      assert.strictEqual(customer.customerEmail, 'alex.shopper@example.com');

      const resolvedUrl = resolveVariable('checkout.abandoned_checkout_url', customer, rawPayload, testStore);
      assert.strictEqual(resolvedUrl, 'https://shop.example.com/checkouts/c/9911002/recover?utm_source=wanotify');

      const resolvedEmail = resolveVariable('customer.email', customer, rawPayload, testStore);
      assert.strictEqual(resolvedEmail, 'alex.shopper@example.com');

      // Test buildDynamicTemplate with recovery link
      const rule = {
        templateName: 'abandoned_cart_recovery',
        languageCode: 'en',
        variableMap: {
          '1': 'customer.first_name',
          '2': 'order.formatted_total',
          '3': 'checkout.abandoned_checkout_url',
        },
      };

      const dynamicTemplate = buildDynamicTemplate(rule, customer, rawPayload, testStore);
      assert.strictEqual(dynamicTemplate.templateName, 'abandoned_cart_recovery');
      assert.strictEqual(dynamicTemplate.components[0].parameters[0].text, 'Alex');
      assert.strictEqual(dynamicTemplate.components[0].parameters[1].text, 'USD 89.99');
      assert.strictEqual(dynamicTemplate.components[0].parameters[2].text, 'https://shop.example.com/checkouts/c/9911002/recover?utm_source=wanotify');

      console.log('   ✅ checkout.abandoned_checkout_url successfully resolved and injected into Meta template parameters\n');
    }

    // =========================================================================
    // Test 3: Deduplication / Organic Conversion Check (Customer Bought)
    // =========================================================================
    console.log('3️⃣ Testing Deduplication & Organic Conversion Check (RECOVERED_ORGANICALLY) ...');
    {
      const convertedPhone = '15553334444';
      const convertedEmail = 'buyer.converted@example.com';

      // 3a. Record a recent completed order for this customer
      await prisma.messageLog.create({
        data: {
          storeId: testStore.id,
          customerPhone: convertedPhone,
          status: 'SENT',
          channel: 'WHATSAPP',
          metadata: {
            topic: 'orders/create',
            triggerEvent: 'ORDER_CREATED',
            customerEmail: convertedEmail,
            orderNumber: '#1055',
          },
        },
      });

      // 3b. Verify helper identifies organic conversion
      const hasRecentOrder = await checkRecentOrderForCustomer(testStore.id, {
        customerPhone: convertedPhone,
        customerEmail: convertedEmail,
        checkoutCreatedAt: new Date(Date.now() - 30 * 60 * 1000),
      });
      assert.strictEqual(hasRecentOrder, true);

      // 3c. Enable ABANDONED_CHECKOUT rule for the store
      await prisma.notificationRule.upsert({
        where: {
          storeId_triggerEvent: {
            storeId: testStore.id,
            triggerEvent: 'ABANDONED_CHECKOUT',
          },
        },
        create: {
          storeId: testStore.id,
          triggerEvent: 'ABANDONED_CHECKOUT',
          isEnabled: true,
          templateName: 'abandoned_cart_recovery',
          languageCode: 'en',
          variableMap: {
            '1': 'customer.first_name',
            '2': 'checkout.abandoned_checkout_url',
          },
        },
        update: {
          isEnabled: true,
        },
      });

      // 3d. Process delayed checkout job for already converted customer
      const convertedJob = {
        id: `job_chk_converted_${Date.now()}`,
        data: {
          storeId: testStore.id,
          platform: 'SHOPIFY',
          topic: 'checkouts/create',
          payload: {
            id: 9911003,
            email: convertedEmail,
            phone: `+${convertedPhone}`,
            abandoned_checkout_url: 'https://shop.example.com/checkout/9911003',
            customer: { first_name: 'Daniel', email: convertedEmail },
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
        },
      };

      const result = await processWebhookJob(convertedJob);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.skipped, true);
      assert.strictEqual(result.reason, 'RECOVERED_ORGANICALLY');

      // Verify PostgreSQL message log
      const logRecord = await prisma.messageLog.findUnique({
        where: { id: result.messageLogId },
      });
      assert.strictEqual(logRecord.status, 'SENT');
      assert.strictEqual(logRecord.metadata.reason, 'RECOVERED_ORGANICALLY');
      assert.strictEqual(logRecord.metadata.recoveredOrganically, true);

      console.log('   ✅ Customer order detected: Skipped message delivery and logged RECOVERED_ORGANICALLY in PostgreSQL\n');
    }

    // =========================================================================
    // Test 4: Recovery Message Dispatch (Unconverted Customer)
    // =========================================================================
    console.log('4️⃣ Testing Unconverted Checkout Recovery Message Dispatch ...');
    {
      const unconvertedPhone = '15557778888';
      const recoveryLink = 'https://shop.example.com/checkout/9911004/recover';

      const originalFetch = globalThis.fetch;
      let interceptedPayload = null;

      globalThis.fetch = async (url, options) => {
        if (typeof url === 'string' && url.includes('graph.facebook.com')) {
          interceptedPayload = JSON.parse(options.body);
          return {
            ok: true,
            status: 200,
            json: async () => ({
              messaging_product: 'whatsapp',
              contacts: [{ input: unconvertedPhone, wa_id: unconvertedPhone }],
              messages: [{ id: `wamid.ABANDONED_TEST_${Date.now()}` }],
            }),
          };
        }
        return originalFetch(url, options);
      };

      let dispatchResult;
      try {
        const unconvertedJob = {
          id: `job_chk_unconverted_${Date.now()}`,
          data: {
            storeId: testStore.id,
            platform: 'SHOPIFY',
            topic: 'checkouts/create',
            payload: {
              id: 9911004,
              email: 'unconverted@example.com',
              phone: `+${unconvertedPhone}`,
              abandoned_checkout_url: recoveryLink,
              customer: { first_name: 'Elena', last_name: 'Gilbert' },
              created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
          },
        };

        dispatchResult = await processWebhookJob(unconvertedJob);
      } finally {
        globalThis.fetch = originalFetch;
      }

      assert.strictEqual(dispatchResult.success, true);
      assert.strictEqual(dispatchResult.templateName, 'abandoned_cart_recovery');
      assert.ok(dispatchResult.messageId);

      // Verify Meta API intercepted payload
      assert.ok(interceptedPayload);
      assert.strictEqual(interceptedPayload.to, unconvertedPhone);
      assert.strictEqual(interceptedPayload.template.name, 'abandoned_cart_recovery');
      const paramLink = interceptedPayload.template.components[0].parameters.find(
        (p) => p.text === recoveryLink
      );
      assert.ok(paramLink, 'Expected recovery link parameter in Meta payload');

      // Verify DB log
      const logRecord = await prisma.messageLog.findUnique({
        where: { id: dispatchResult.messageLogId },
      });
      assert.strictEqual(logRecord.status, 'SENT');
      assert.strictEqual(logRecord.metadata.checkoutUrl, recoveryLink);
      assert.strictEqual(logRecord.metadata.triggerEvent, 'ABANDONED_CHECKOUT');

      console.log('   ✅ Unconverted customer: Meta API dispatched recovery message with checkout recovery link\n');
    }

    // =========================================================================
    // Test 5: Dashboard Analytics API (GET /api/dashboard/stats)
    // =========================================================================
    console.log('5️⃣ Testing Dashboard Analytics API (GET /api/dashboard/stats) ...');
    {
      const statsRes = await request
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      assert.strictEqual(statsRes.body.success, true);
      const { stats } = statsRes.body;

      // We dispatched 1 successful recovery message (Test 4) and 1 organic conversion (Test 3)
      assert.strictEqual(stats.recoveredCheckouts >= 1, true);
      assert.strictEqual(stats.abandonedCartsSaved >= 1, true);
      assert.strictEqual(stats.recoveredOrganically >= 1, true);

      console.log(`   ✅ Dashboard Stats KPI returned recoveredCheckouts: ${stats.recoveredCheckouts}, recoveredOrganically: ${stats.recoveredOrganically}\n`);
    }

    // =========================================================================
    // Test 6: Automation Rules Integration (Disabled Rule)
    // =========================================================================
    console.log('6️⃣ Testing Webhook Worker Skipping Disabled ABANDONED_CHECKOUT ...');
    {
      // Disable ABANDONED_CHECKOUT
      await prisma.notificationRule.update({
        where: {
          storeId_triggerEvent: {
            storeId: testStore.id,
            triggerEvent: 'ABANDONED_CHECKOUT',
          },
        },
        data: { isEnabled: false },
      });

      const disabledJob = {
        id: `job_chk_disabled_${Date.now()}`,
        data: {
          storeId: testStore.id,
          platform: 'SHOPIFY',
          topic: 'checkouts/create',
          payload: {
            id: 9911005,
            phone: '+15559990000',
            abandoned_checkout_url: 'https://shop.example.com/checkout/9911005',
          },
        },
      };

      const result = await processWebhookJob(disabledJob);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.skipped, true);
      assert.strictEqual(result.reason, 'AUTOMATION_DISABLED');

      const log = await prisma.messageLog.findUnique({
        where: { id: result.messageLogId },
      });
      assert.strictEqual(log.metadata.reason, 'AUTOMATION_DISABLED');

      console.log('   ✅ Webhook Worker skipped checkout recovery when automation is disabled (isEnabled: false)\n');
    }

    console.log('🎉 ALL 6 STEP 15 ABANDONED CHECKOUT RECOVERY TESTS PASSED SUCCESSFULLY!\n');
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
    await prisma.$disconnect();
  }
}

runAbandonedCheckoutTests()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Step 15 Abandoned Checkout Test Suite Failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
