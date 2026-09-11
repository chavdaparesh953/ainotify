/**
 * Step 12 Verification Test Suite
 * Automated Two-Way COD Order Write-back (Shopify & WooCommerce)
 *
 * Tests:
 * 1. Shopify Order Write-back: Tags ('COD-Confirmed'/'COD-Cancelled') and Order Note
 * 2. WooCommerce Order Write-back: Status update ('processing'/'cancelled') and Order Note
 * 3. Unified Dispatcher (syncOrderToStore): Updates PostgreSQL syncStatus to 'SYNCED'
 * 4. Error Resilience: Invalid store/failure sets syncStatus to 'FAILED'
 * 5. End-to-End Inbound Meta Webhook Trigger: Customer confirmation triggers store write-back
 * 6. Merchant Dashboard API: GET /api/dashboard/recent-logs includes syncStatus in orderVerification
 */

import assert from 'node:assert';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import prisma from '../src/db/prisma.js';
import config from '../src/config/env.js';
import {
  updateShopifyOrder,
  updateWooCommerceOrder,
  syncOrderToStore,
} from '../src/services/ecommerceService.js';

const app = createApp();
const request = supertest(app);

async function runEcommerceSyncTests() {
  console.log('🧪 Starting Step 12 Verification Test Suite (Automated Two-Way COD Order Write-back)...\n');

  let testUser = null;
  let shopifyStore = null;
  let wooStore = null;
  let merchantToken = null;

  try {
    // Setup: Merchant and Stores
    testUser = await prisma.user.create({
      data: {
        email: `sync.merchant.${Date.now()}@example.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        plan: 'PRO',
        subscriptionStatus: 'ACTIVE',
      },
    });

    shopifyStore = await prisma.store.create({
      data: {
        userId: testUser.id,
        platform: 'SHOPIFY',
        storeUrl: `sync-shopify-${Date.now()}.myshopify.com`,
        accessToken: 'shpat_mock_shopify_token',
        webhookSecret: 'secret_shopify_123',
      },
    });

    wooStore = await prisma.store.create({
      data: {
        userId: testUser.id,
        platform: 'WOOCOMMERCE',
        storeUrl: `https://sync-woo-${Date.now()}.example.com`,
        accessToken: 'ck_mock_consumer_key:cs_mock_consumer_secret',
        webhookSecret: 'secret_woo_123',
      },
    });

    merchantToken = jwt.sign(
      { id: testUser.id, email: testUser.email, subscriptionStatus: testUser.subscriptionStatus },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // =========================================================================
    // Test 1: Shopify Order Write-back (updateShopifyOrder)
    // =========================================================================
    console.log('1️⃣ Testing Shopify Order Write-back (Tags & Notes) ...');
    const shopifyConfirm = await updateShopifyOrder(shopifyStore, '777001', 'CONFIRMED');
    assert.strictEqual(shopifyConfirm.success, true);
    assert.strictEqual(shopifyConfirm.tag, 'COD-Confirmed');
    assert.ok(shopifyConfirm.note.includes('Cash on Delivery verified'));

    const shopifyCancel = await updateShopifyOrder(shopifyStore, '777001', 'CANCELLED');
    assert.strictEqual(shopifyCancel.success, true);
    assert.strictEqual(shopifyCancel.tag, 'COD-Cancelled');
    assert.ok(shopifyCancel.note.includes('Cash on Delivery cancelled'));
    console.log('   ✅ Shopify write-back generates correct tags ("COD-Confirmed" / "COD-Cancelled") and audit notes\n');

    // =========================================================================
    // Test 2: WooCommerce Order Write-back (updateWooCommerceOrder)
    // =========================================================================
    console.log('2️⃣ Testing WooCommerce Order Write-back (Status & Notes) ...');
    const wooConfirm = await updateWooCommerceOrder(wooStore, '888001', 'CONFIRMED');
    assert.strictEqual(wooConfirm.success, true);
    assert.strictEqual(wooConfirm.status, 'processing');
    assert.ok(wooConfirm.note.includes('verified'));

    const wooCancel = await updateWooCommerceOrder(wooStore, '888001', 'CANCELLED');
    assert.strictEqual(wooCancel.success, true);
    assert.strictEqual(wooCancel.status, 'cancelled');
    assert.ok(wooCancel.note.includes('cancelled'));
    console.log('   ✅ WooCommerce write-back maps to correct statuses ("processing" / "cancelled") and audit notes\n');

    // =========================================================================
    // Test 3: Unified Dispatcher (syncOrderToStore) with Database Persistence
    // =========================================================================
    console.log('3️⃣ Testing Unified syncOrderToStore with PostgreSQL syncStatus Update ...');
    const shopifyVerification = await prisma.orderVerification.create({
      data: {
        storeId: shopifyStore.id,
        orderId: '777002',
        orderNumber: '#1050',
        customerPhone: '+919876543210',
        totalAmount: '$89.00',
        status: 'CONFIRMED',
        syncStatus: 'PENDING',
      },
    });

    const syncResult = await syncOrderToStore(shopifyVerification.id, 'CONFIRMED');
    assert.strictEqual(syncResult.success, true);
    assert.strictEqual(syncResult.syncStatus, 'SYNCED');

    const freshRecord = await prisma.orderVerification.findUnique({
      where: { id: shopifyVerification.id },
    });
    assert.strictEqual(freshRecord.syncStatus, 'SYNCED');
    assert.ok(freshRecord.metadata?.storeSync);
    assert.strictEqual(freshRecord.metadata.storeSync.platform, 'SHOPIFY');
    assert.strictEqual(freshRecord.metadata.storeSync.action, 'CONFIRMED');
    console.log('   ✅ syncOrderToStore persisted syncStatus: "SYNCED" with audit metadata to PostgreSQL\n');

    // =========================================================================
    // Test 4: Error Handling & Resilience (Non-existent Store or Failure)
    // =========================================================================
    console.log('4️⃣ Testing Error Handling (syncStatus -> FAILED) ...');
    const fakeVerification = await prisma.orderVerification.create({
      data: {
        storeId: shopifyStore.id,
        orderId: '777999',
        customerPhone: '+919999999999',
        status: 'PENDING',
        syncStatus: 'PENDING',
      },
    });

    // Artificially change to invalid platform on in-memory call
    const failResult = await syncOrderToStore(
      {
        ...fakeVerification,
        store: { platform: 'UNSUPPORTED_PLATFORM' },
      },
      'CONFIRMED'
    );
    assert.strictEqual(failResult.syncStatus, 'FAILED');

    const failedRecord = await prisma.orderVerification.findUnique({
      where: { id: fakeVerification.id },
    });
    assert.strictEqual(failedRecord.syncStatus, 'FAILED');
    console.log('   ✅ Unsupported platform or failure sets syncStatus to "FAILED" without crashing\n');

    // =========================================================================
    // Test 5: End-to-End Inbound Meta Webhook Trigger
    // =========================================================================
    console.log('5️⃣ Testing Inbound Meta Webhook Button Click Triggering Store Write-back ...');
    const inboundVerification = await prisma.orderVerification.create({
      data: {
        storeId: shopifyStore.id,
        orderId: '999123',
        orderNumber: '#1099',
        customerPhone: '+14155552671',
        totalAmount: '$120.00',
        status: 'PENDING',
        syncStatus: 'PENDING',
      },
    });

    const metaWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15550234567',
                  phone_number_id: '10987654321',
                },
                contacts: [{ wa_id: '14155552671', profile: { name: 'Customer Test' } }],
                messages: [
                  {
                    from: '14155552671',
                    id: `wamid.test.sync.${Date.now()}`,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    type: 'interactive',
                    interactive: {
                      type: 'button_reply',
                      button_reply: {
                        id: 'cod_confirm_999123',
                        title: '✅ Confirm Order',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const webhookRes = await request
      .post('/api/webhooks/meta')
      .send(metaWebhookPayload)
      .expect(200);

    assert.strictEqual(webhookRes.body.success, true);
    assert.strictEqual(webhookRes.body.processed, true);
    assert.strictEqual(webhookRes.body.events[0].syncStatus, 'SYNCED');

    const verifiedRecord = await prisma.orderVerification.findUnique({
      where: { id: inboundVerification.id },
    });
    assert.strictEqual(verifiedRecord.status, 'CONFIRMED');
    assert.strictEqual(verifiedRecord.syncStatus, 'SYNCED');
    console.log('   ✅ Meta Webhook button click updated status to "CONFIRMED" and syncStatus to "SYNCED"\n');

    // =========================================================================
    // Test 6: Merchant Dashboard API Returning syncStatus
    // =========================================================================
    console.log('6️⃣ Testing Merchant Dashboard API (GET /api/dashboard/recent-logs with syncStatus) ...');
    // Create a message log linked to inboundVerification
    const log = await prisma.messageLog.create({
      data: {
        storeId: shopifyStore.id,
        customerPhone: '+14155552671',
        status: 'SENT',
        channel: 'WHATSAPP',
      },
    });

    await prisma.orderVerification.update({
      where: { id: inboundVerification.id },
      data: { messageLogId: log.id },
    });

    const logsRes = await request
      .get('/api/dashboard/recent-logs')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    assert.strictEqual(logsRes.body.success, true);
    assert.ok(logsRes.body.logs.length > 0);

    const logWithCod = logsRes.body.logs.find((l) => l.orderVerification);
    assert.ok(logWithCod);
    assert.strictEqual(logWithCod.orderVerification.syncStatus, 'SYNCED');
    console.log('   ✅ Dashboard recent-logs API correctly exposes syncStatus ("SYNCED") on orderVerification\n');

    console.log('🎉 ALL 6 STEP 12 TWO-WAY E-COMMERCE WRITE-BACK TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    // Cleanup test artifacts
    if (shopifyStore) {
      await prisma.orderVerification.deleteMany({ where: { storeId: shopifyStore.id } });
      await prisma.messageLog.deleteMany({ where: { storeId: shopifyStore.id } });
      await prisma.store.delete({ where: { id: shopifyStore.id } });
    }
    if (wooStore) {
      await prisma.orderVerification.deleteMany({ where: { storeId: wooStore.id } });
      await prisma.messageLog.deleteMany({ where: { storeId: wooStore.id } });
      await prisma.store.delete({ where: { id: wooStore.id } });
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    await prisma.$disconnect();
  }
}

runEcommerceSyncTests()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Step 12 Test Suite Failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
