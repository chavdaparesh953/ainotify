/**
 * Step 10 Verification Test Suite
 * Interactive COD (Cash on Delivery) Order Verification Flow
 *
 * Tests:
 * 1. Meta Webhook Handshake Verification (GET /api/webhooks/meta with hub.challenge)
 * 2. Meta Webhook Security Rejection for Invalid Verify Token (403 Forbidden)
 * 3. Worker COD Order Detection, OrderVerification creation, & Interactive Button Dispatch
 * 4. Inbound Meta Webhook Button Click: Customer Confirms COD Order (Status -> CONFIRMED)
 * 5. Inbound Meta Webhook Button Click: Customer Cancels COD Order (Status -> CANCELLED)
 * 6. Quick Reply Button Payload Fallback Compatibility
 * 7. Merchant Dashboard API (GET /api/dashboard/recent-logs) returning orderVerification
 */

import assert from 'node:assert';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/db/prisma.js';
import config from '../src/config/env.js';
import { processWebhookJob } from '../src/workers/webhookWorker.js';
import jwt from 'jsonwebtoken';

const app = createApp();
const request = supertest(app);

async function runCodFlowTests() {
  console.log('🧪 Starting Step 10 Verification Test Suite (Interactive COD Verification Flow)...\n');

  let testUser = null;
  let testStore = null;
  let merchantToken = null;
  const testOrderId = `order_cod_${Date.now()}`;
  const testCustomerPhone = '919876543210';

  try {
    // 0. Setup Test Merchant & Store
    testUser = await prisma.user.create({
      data: {
        email: `cod.merchant.${Date.now()}@example.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        plan: 'PRO',
        subscriptionStatus: 'ACTIVE',
      },
    });

    testStore = await prisma.store.create({
      data: {
        userId: testUser.id,
        platform: 'SHOPIFY',
        storeUrl: `cod-store-${Date.now()}.myshopify.com`,
        accessToken: 'shpat_test_store_token_123',
        webhookSecret: 'secret_cod_123',
        metaAccessToken: 'mock_meta_store_token',
        metaPhoneNumberId: '10987654321',
      },
    });

    merchantToken = jwt.sign(
      { id: testUser.id, email: testUser.email, subscriptionStatus: testUser.subscriptionStatus },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // =========================================================================
    // Test 1: Meta Webhook GET Handshake Verification (hub.challenge)
    // =========================================================================
    console.log('1️⃣ Testing Meta Webhook Verification Handshake (GET /api/webhooks/meta) ...');
    {
      const verifyToken = config.meta.webhookVerifyToken || 'omnipulse_meta_verify_token_123';
      const challengeCode = '1158201444';

      const res = await request
        .get('/api/webhooks/meta')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
          'hub.challenge': challengeCode,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.text, challengeCode);
      console.log('   ✅ Responded with hub.challenge string (200 OK)\n');
    }

    // =========================================================================
    // Test 2: Meta Webhook Security Rejection for Invalid Verify Token
    // =========================================================================
    console.log('2️⃣ Testing Meta Webhook Security Check (Tampered Verify Token) ...');
    {
      const res = await request
        .get('/api/webhooks/meta')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong_invalid_token_xyz',
          'hub.challenge': '999999999',
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, 'Forbidden');
      console.log('   ✅ Unauthorized handshake correctly rejected (403 Forbidden)\n');
    }

    // =========================================================================
    // Test 3: Worker COD Order Detection & Interactive Message Dispatch
    // =========================================================================
    console.log('3️⃣ Testing Worker COD Detection, OrderVerification creation, & Interactive Buttons ...');
    let createdVerification = null;
    {
      const originalFetch = globalThis.fetch;
      let dispatchedPayload = null;

      // Intercept Meta Cloud API dispatch
      globalThis.fetch = async (url, opts) => {
        dispatchedPayload = JSON.parse(opts.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            messages: [{ id: `wamid.COD_INTERACTIVE_${Date.now()}` }],
          }),
        };
      };

      try {
        const codJob = {
          id: `job_cod_${Date.now()}`,
          data: {
            storeId: testStore.id,
            storeUrl: testStore.storeUrl,
            platform: 'SHOPIFY',
            topic: 'orders/create',
            payload: {
              id: testOrderId,
              order_number: 1042,
              gateway: 'Cash on Delivery (COD)',
              financial_status: 'pending',
              total_price: '1499.00',
              currency: 'INR',
              shipping_address: {
                first_name: 'Rohit',
                last_name: 'Verma',
                phone: `+${testCustomerPhone}`,
              },
            },
          },
        };

        const result = await processWebhookJob(codJob);
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.isCod, true);
        assert.ok(result.orderVerificationId, 'Expected orderVerificationId to be returned');

        // Verify dispatched interactive payload structure
        assert.ok(dispatchedPayload, 'Expected Meta API fetch to be called');
        assert.strictEqual(dispatchedPayload.type, 'interactive');
        assert.strictEqual(dispatchedPayload.interactive.type, 'button');
        assert.strictEqual(dispatchedPayload.interactive.action.buttons.length, 2);

        const confirmBtn = dispatchedPayload.interactive.action.buttons.find((b) =>
          b.reply.id.includes('cod_confirm')
        );
        const cancelBtn = dispatchedPayload.interactive.action.buttons.find((b) =>
          b.reply.id.includes('cod_cancel')
        );
        assert.ok(confirmBtn, 'Expected Confirm button with cod_confirm payload');
        assert.ok(cancelBtn, 'Expected Cancel button with cod_cancel payload');

        // Verify OrderVerification in PostgreSQL
        createdVerification = await prisma.orderVerification.findUnique({
          where: { id: result.orderVerificationId },
        });
        assert.ok(createdVerification);
        assert.strictEqual(createdVerification.status, 'PENDING');
        assert.strictEqual(createdVerification.orderId, testOrderId);
        assert.strictEqual(createdVerification.customerPhone, testCustomerPhone);
        assert.strictEqual(createdVerification.totalAmount, 'INR 1499.00');

        console.log('   ✅ COD Order detected: Dispatched Interactive Buttons with cod_confirm & cod_cancel IDs');
        console.log(`   ✅ OrderVerification created in PostgreSQL with status: PENDING (ID: ${createdVerification.id})\n`);
      } finally {
        globalThis.fetch = originalFetch;
      }
    }

    // =========================================================================
    // Test 4: Inbound Meta Webhook: Customer Clicks "Confirm Order"
    // =========================================================================
    console.log('4️⃣ Testing Inbound Meta Webhook: Customer Confirms COD Order ...');
    {
      const mockMetaConfirmEvent = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_MOCK_123',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  messages: [
                    {
                      from: testCustomerPhone,
                      id: `wamid.BUTTON_CONFIRM_${Date.now()}`,
                      timestamp: String(Math.floor(Date.now() / 1000)),
                      type: 'interactive',
                      interactive: {
                        type: 'button_reply',
                        button_reply: {
                          id: `cod_confirm_${testOrderId}`,
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

      const res = await request
        .post('/api/webhooks/meta')
        .send(mockMetaConfirmEvent);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.events.length, 1);
      assert.strictEqual(res.body.events[0].status, 'CONFIRMED');

      // Verify PostgreSQL state
      const confirmedRecord = await prisma.orderVerification.findUnique({
        where: { id: createdVerification.id },
      });
      assert.strictEqual(confirmedRecord.status, 'CONFIRMED');
      assert.ok(confirmedRecord.confirmedAt, 'Expected confirmedAt timestamp');
      console.log('   ✅ Inbound button click processed: Status updated to CONFIRMED with confirmedAt in PostgreSQL\n');
    }

    // =========================================================================
    // Test 5: Inbound Meta Webhook: Customer Clicks "Cancel Order"
    // =========================================================================
    console.log('5️⃣ Testing Inbound Meta Webhook: Customer Cancels COD Order ...');
    {
      // Create a second pending verification
      const cancelOrderId = `order_cancel_${Date.now()}`;
      const pendingCancelRecord = await prisma.orderVerification.create({
        data: {
          storeId: testStore.id,
          orderId: cancelOrderId,
          orderNumber: '#1043',
          customerPhone: '919876543299',
          customerName: 'Pooja Patel',
          totalAmount: 'INR 2499.00',
          status: 'PENDING',
          channel: 'WHATSAPP',
        },
      });

      const mockMetaCancelEvent = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_MOCK_123',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  messages: [
                    {
                      from: '919876543299',
                      id: `wamid.BUTTON_CANCEL_${Date.now()}`,
                      type: 'interactive',
                      interactive: {
                        type: 'button_reply',
                        button_reply: {
                          id: `cod_cancel_${cancelOrderId}`,
                          title: '❌ Cancel Order',
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

      const res = await request
        .post('/api/webhooks/meta')
        .send(mockMetaCancelEvent);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.events[0].status, 'CANCELLED');

      const canceledRecord = await prisma.orderVerification.findUnique({
        where: { id: pendingCancelRecord.id },
      });
      assert.strictEqual(canceledRecord.status, 'CANCELLED');
      assert.ok(canceledRecord.cancelledAt, 'Expected cancelledAt timestamp');
      console.log('   ✅ Inbound cancel click processed: Status updated to CANCELLED with cancelledAt in PostgreSQL\n');
    }

    // =========================================================================
    // Test 6: Quick Reply Button Payload Fallback Compatibility
    // =========================================================================
    console.log('6️⃣ Testing Quick Reply Template Button Compatibility ...');
    {
      const qrOrderId = `order_qr_${Date.now()}`;
      const qrRecord = await prisma.orderVerification.create({
        data: {
          storeId: testStore.id,
          orderId: qrOrderId,
          orderNumber: '#1044',
          customerPhone: '919876543288',
          status: 'PENDING',
        },
      });

      const mockQrEvent = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '919876543288',
                      id: `wamid.QR_MSG_${Date.now()}`,
                      type: 'button',
                      button: {
                        text: 'Confirm Order',
                        payload: `cod_confirm_${qrOrderId}`,
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const res = await request
        .post('/api/webhooks/meta')
        .send(mockQrEvent);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.events[0].status, 'CONFIRMED');

      const verifiedQrRecord = await prisma.orderVerification.findUnique({
        where: { id: qrRecord.id },
      });
      assert.strictEqual(verifiedQrRecord.status, 'CONFIRMED');
      console.log('   ✅ Quick Reply button payload successfully confirmed order\n');
    }

    // =========================================================================
    // Test 7: Merchant Dashboard API Includes COD Verification Details
    // =========================================================================
    console.log('7️⃣ Testing Merchant Dashboard API (GET /api/dashboard/recent-logs with orderVerification) ...');
    {
      const res = await request
        .get('/api/dashboard/recent-logs')
        .set('Authorization', `Bearer ${merchantToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.logs.length > 0, 'Expected at least 1 message log');

      const codLog = res.body.logs.find((l) => l.orderVerification !== null);
      assert.ok(codLog, 'Expected at least one log with linked orderVerification');
      assert.strictEqual(codLog.orderVerification.orderId, testOrderId);
      assert.strictEqual(codLog.orderVerification.status, 'CONFIRMED');
      console.log('   ✅ GET /api/dashboard/recent-logs returned message log with linked orderVerification (Status: CONFIRMED)\n');
    }

    console.log('🎉 ALL 7 STEP 10 COD VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    // Cleanup
    if (testStore) {
      await prisma.orderVerification.deleteMany({ where: { storeId: testStore.id } }).catch(() => {});
      await prisma.messageLog.deleteMany({ where: { storeId: testStore.id } }).catch(() => {});
      await prisma.store.delete({ where: { id: testStore.id } }).catch(() => {});
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runCodFlowTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ COD Flow test failed:', err);
    process.exit(1);
  });
