import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/db/prisma.js';
import config from '../src/config/env.js';

async function runBillingTests() {
  console.log('🧪 Starting Step 9 Verification Test Suite (Stripe Subscription & Monetization System)...\n');
  const app = createApp();
  const request = supertest(app);

  const testEmail = `billing_test_${Date.now()}@merchant.com`;
  let testUser = null;
  let authToken = null;

  try {
    // Setup: Create test merchant user
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'hashed_password_123',
        plan: 'FREE',
        subscriptionStatus: 'TRIAL',
      },
    });

    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // =========================================================================
    // Test 1: Unauthenticated request should be rejected (401)
    // =========================================================================
    console.log('1️⃣ Testing Unauthenticated Route Protection ...');
    {
      const res = await request.get('/api/billing/current-plan');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      console.log('   ✅ GET /api/billing/current-plan blocked without JWT (401 Unauthorized)\n');
    }

    // =========================================================================
    // Test 2: GET /api/billing/current-plan returns merchant plan & quotas
    // =========================================================================
    console.log('2️⃣ Testing GET /api/billing/current-plan ...');
    {
      const res = await request
        .get('/api/billing/current-plan')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.subscription.plan, 'FREE');
      assert.strictEqual(res.body.subscription.status, 'TRIAL');
      assert.ok('usage' in res.body.subscription);
      assert.ok('availablePlans' in res.body);
      assert.strictEqual(res.body.availablePlans.BASIC.price, 12);
      assert.strictEqual(res.body.availablePlans.PRO.price, 35);
      console.log('   ✅ Retrieved active merchant plan, usage quotas, and pricing matrix (200 OK)\n');
    }

    // =========================================================================
    // Test 3: POST /api/billing/create-checkout-session for plan upgrade
    // =========================================================================
    console.log('3️⃣ Testing POST /api/billing/create-checkout-session ...');
    {
      const res = await request
        .post('/api/billing/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plan: 'BASIC' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok('url' in res.body);
      assert.ok('sessionId' in res.body);
      console.log(`   ✅ Initialized Stripe Checkout Session: ${res.body.sessionId} (200 OK)\n`);
    }

    // =========================================================================
    // Test 4: Reject invalid plan upgrade request
    // =========================================================================
    console.log('4️⃣ Testing Invalid Plan Request Handling ...');
    {
      const res = await request
        .post('/api/billing/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plan: 'ULTRA_PLATINUM_FAKE' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      console.log('   ✅ Invalid plan request gracefully rejected (400 Bad Request)\n');
    }

    // =========================================================================
    // Test 5: Customer Portal Session Generation
    // =========================================================================
    console.log('5️⃣ Testing POST /api/billing/customer-portal ...');
    {
      const res = await request
        .post('/api/billing/customer-portal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok('url' in res.body);
      console.log('   ✅ Generated Stripe Customer Billing Portal redirect session (200 OK)\n');
    }

    // =========================================================================
    // Test 6: Stripe Webhook: checkout.session.completed (Promote to PRO)
    // =========================================================================
    console.log('6️⃣ Testing Stripe Webhook: checkout.session.completed ...');
    {
      const mockCheckoutEvent = {
        id: `evt_test_${Date.now()}`,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_completed_123',
            client_reference_id: testUser.id,
            customer: `cus_stripe_real_${Date.now()}`,
            subscription: 'sub_test_pro_456',
            metadata: {
              userId: testUser.id,
              plan: 'PRO',
            },
          },
        },
      };

      const res = await request
        .post('/api/billing/webhook')
        .set('stripe-signature', 'mock_valid_signature')
        .send(mockCheckoutEvent);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.received, true);

      // Verify user record updated in PostgreSQL
      const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
      assert.strictEqual(updatedUser.plan, 'PRO');
      assert.strictEqual(updatedUser.subscriptionStatus, 'ACTIVE');
      assert.strictEqual(updatedUser.stripeSubscriptionId, 'sub_test_pro_456');
      console.log('   ✅ Webhook processed: User promoted to PRO with ACTIVE subscription in PostgreSQL\n');
    }

    // =========================================================================
    // Test 7: Stripe Webhook: customer.subscription.deleted (Revert to FREE)
    // =========================================================================
    console.log('7️⃣ Testing Stripe Webhook: customer.subscription.deleted ...');
    {
      const mockCancelEvent = {
        id: `evt_cancel_${Date.now()}`,
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test_pro_456',
            customer: testUser.stripeCustomerId || 'cus_test',
            status: 'canceled',
          },
        },
      };

      const res = await request
        .post('/api/billing/webhook')
        .set('stripe-signature', 'mock_valid_signature')
        .send(mockCancelEvent);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.received, true);

      // Verify user record reverted in PostgreSQL
      const canceledUser = await prisma.user.findUnique({ where: { id: testUser.id } });
      assert.strictEqual(canceledUser.plan, 'FREE');
      assert.strictEqual(canceledUser.subscriptionStatus, 'CANCELED');
      console.log('   ✅ Webhook processed: User reverted to FREE and CANCELED status in PostgreSQL\n');
    }

    console.log('🎉 ALL 7 STEP 9 BILLING & STRIPE VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runBillingTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Billing test failed:', err);
    process.exit(1);
  });

