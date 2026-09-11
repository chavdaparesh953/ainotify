import assert from 'node:assert';
import request from 'supertest';
import createApp from '../src/app.js';
import prisma from '../src/db/prisma.js';

const app = createApp();

async function runOnboardingTests() {
  console.log('🧪 Starting Step 16 Verification Test Suite (Smart User Onboarding Wizard)...\n');

  const testEmail = `onboarding_test_${Date.now()}@store.com`;
  const testPassword = 'Password123!';
  let authToken = null;
  let userId = null;
  let storeId = null;

  try {
    // -------------------------------------------------------------------------
    // Test 1: User Registration Defaults to isOnboarded: false
    // -------------------------------------------------------------------------
    console.log('1️⃣ Testing User Registration Defaults (isOnboarded: false) ...');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword });

    assert.strictEqual(registerRes.status, 201, 'Expected 201 Created on registration');
    assert.strictEqual(registerRes.body.success, true);
    assert.ok(registerRes.body.token, 'Expected JWT token on registration');
    assert.strictEqual(registerRes.body.user.isOnboarded, false, 'Expected isOnboarded to be false by default');
    
    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;
    console.log('   ✅ Newly registered user has isOnboarded: false');

    // -------------------------------------------------------------------------
    // Test 2: GET /api/auth/me Returns isOnboarded: false
    // -------------------------------------------------------------------------
    console.log('2️⃣ Testing GET /api/auth/me returns isOnboarded status ...');
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(meRes.status, 200, 'Expected 200 OK on GET /api/auth/me');
    assert.strictEqual(meRes.body.success, true);
    assert.strictEqual(meRes.body.user.email, testEmail);
    assert.strictEqual(meRes.body.user.isOnboarded, false, 'Expected isOnboarded: false in me response');
    console.log('   ✅ GET /api/auth/me returns isOnboarded: false for new merchant');

    // -------------------------------------------------------------------------
    // Test 3: Unauthenticated /api/auth/complete-onboarding is Rejected
    // -------------------------------------------------------------------------
    console.log('3️⃣ Testing Unauthenticated POST /api/auth/complete-onboarding ...');
    const unauthRes = await request(app)
      .post('/api/auth/complete-onboarding');

    assert.strictEqual(unauthRes.status, 401, 'Expected 401 Unauthorized without token');
    assert.strictEqual(unauthRes.body.error, 'Unauthorized');
    console.log('   ✅ Unauthenticated request rejected (401 Unauthorized)');

    // -------------------------------------------------------------------------
    // Test 4: Wizard Step 1 - Connect Store
    // -------------------------------------------------------------------------
    console.log('4️⃣ Simulating Wizard Step 1: Connecting Store (POST /api/stores/connect) ...');
    const storeDomain = `onboard-${Date.now()}.myshopify.com`;
    const connectStoreRes = await request(app)
      .post('/api/stores/connect')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        userId,
        platform: 'SHOPIFY',
        storeUrl: storeDomain,
        accessToken: 'shpat_onboard_test_token',
        webhookSecret: 'shpss_onboard_test_secret',
      });

    assert.strictEqual(connectStoreRes.status, 200, 'Expected 200 OK on store connection');
    assert.strictEqual(connectStoreRes.body.success, true);
    assert.ok(connectStoreRes.body.store?.id, 'Expected store id in response');
    storeId = connectStoreRes.body.store.id;
    console.log(`   ✅ Store connected successfully: ${storeDomain} (ID: ${storeId})`);

    // -------------------------------------------------------------------------
    // Test 5: Wizard Step 2 - Configure Meta WhatsApp Credentials
    // -------------------------------------------------------------------------
    console.log('5️⃣ Simulating Wizard Step 2: Configure WhatsApp (PUT /api/settings/whatsapp) ...');
    const settingsRes = await request(app)
      .put('/api/settings/whatsapp')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        metaPhoneNumberId: '109988776655443',
        metaBusinessAccountId: '998877665544332',
        metaAccessToken: 'EAAG_ONBOARDING_TEST_TOKEN_123456789',
        storeId,
      });

    assert.strictEqual(settingsRes.status, 200, 'Expected 200 OK on updating WhatsApp settings');
    assert.strictEqual(settingsRes.body.success, true);
    console.log('   ✅ Meta WhatsApp credentials saved successfully');

    // -------------------------------------------------------------------------
    // Test 6: Wizard Step 3 - Quick Automations Batch Update
    // -------------------------------------------------------------------------
    console.log('6️⃣ Simulating Wizard Step 3: Quick Automations (PUT /api/automations/:storeId/batch) ...');
    const batchRulesRes = await request(app)
      .put(`/api/automations/${storeId}/batch`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        rules: [
          {
            triggerEvent: 'ORDER_CREATED',
            isEnabled: true,
            templateName: 'order_confirmation',
            languageCode: 'en',
          },
          {
            triggerEvent: 'COD_VERIFICATION',
            isEnabled: true,
            templateName: 'cod_interactive_verification',
            languageCode: 'en',
          },
          {
            triggerEvent: 'ABANDONED_CHECKOUT',
            isEnabled: true,
            templateName: 'abandoned_cart_recovery',
            languageCode: 'en',
          },
        ],
      });

    assert.strictEqual(batchRulesRes.status, 200, 'Expected 200 OK on batch updating rules');
    assert.strictEqual(batchRulesRes.body.success, true);
    assert.strictEqual(batchRulesRes.body.rules.length, 3);
    console.log('   ✅ Quick automations (COD, Abandoned Cart, Order Confirmation) enabled');

    // -------------------------------------------------------------------------
    // Test 7: Complete Onboarding Endpoint
    // -------------------------------------------------------------------------
    console.log('7️⃣ Testing POST /api/auth/complete-onboarding ...');
    const completeRes = await request(app)
      .post('/api/auth/complete-onboarding')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(completeRes.status, 200, 'Expected 200 OK on complete onboarding');
    assert.strictEqual(completeRes.body.success, true);
    assert.strictEqual(completeRes.body.user.isOnboarded, true, 'Expected isOnboarded to be true in response');
    console.log('   ✅ POST /api/auth/complete-onboarding marked user as onboarded (200 OK)');

    // -------------------------------------------------------------------------
    // Test 8: Verify Subsequent GET /api/auth/me Reflects Onboarded Status
    // -------------------------------------------------------------------------
    console.log('8️⃣ Verifying Subsequent GET /api/auth/me has isOnboarded: true ...');
    const meUpdatedRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(meUpdatedRes.status, 200);
    assert.strictEqual(meUpdatedRes.body.user.isOnboarded, true, 'Expected user.isOnboarded to be true');
    console.log('   ✅ Verified GET /api/auth/me returns isOnboarded: true');

    // -------------------------------------------------------------------------
    // Test 9: Verify Login Also Returns isOnboarded: true
    // -------------------------------------------------------------------------
    console.log('9️⃣ Verifying Subsequent POST /api/auth/login returns isOnboarded: true ...');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.body.user.isOnboarded, true, 'Expected login user.isOnboarded to be true');
    console.log('   ✅ Verified POST /api/auth/login returns isOnboarded: true');

    console.log('\n🎉 ALL 9 STEP 16 ONBOARDING WIZARD TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    // Cleanup test data
    if (storeId) {
      await prisma.notificationRule.deleteMany({ where: { storeId } }).catch(() => {});
      await prisma.orderVerification.deleteMany({ where: { storeId } }).catch(() => {});
      await prisma.messageLog.deleteMany({ where: { storeId } }).catch(() => {});
      await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
    }
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
    process.exit(0);
  }
}

runOnboardingTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
