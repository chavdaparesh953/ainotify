import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/db/prisma.js';
import config from '../src/config/env.js';

async function runEmbeddedSignupTests() {
  console.log('🧪 Starting 1-Click Meta WhatsApp Embedded Signup Verification Test Suite...\n');
  const app = createApp();
  const request = supertest(app);

  const testEmail = `embedded_test_${Date.now()}@merchant.com`;
  const otherEmail = `other_test_${Date.now()}@merchant.com`;
  let testUser = null;
  let testStore = null;
  let otherUser = null;
  let otherStore = null;
  let authToken = null;
  let otherToken = null;

  try {
    // Setup: Create test user and store
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'hashed_password_placeholder',
      },
    });

    testStore = await prisma.store.create({
      data: {
        userId: testUser.id,
        platform: 'SHOPIFY',
        storeUrl: `embedded-store-${Date.now()}.myshopify.com`,
        accessToken: 'shpat_mock_embedded_store_token',
      },
    });

    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Setup another user to verify multi-tenant isolation
    otherUser = await prisma.user.create({
      data: {
        email: otherEmail,
        passwordHash: 'hashed_password_placeholder',
      },
    });

    otherStore = await prisma.store.create({
      data: {
        userId: otherUser.id,
        platform: 'WOOCOMMERCE',
        storeUrl: `other-store-${Date.now()}.com`,
        accessToken: 'cs_mock_other_token',
      },
    });

    otherToken = jwt.sign(
      { id: otherUser.id, email: otherUser.email },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // =========================================================================
    // Test 1: Unauthenticated request must be blocked (401)
    // =========================================================================
    console.log('1️⃣ Testing Unauthenticated Access Protection ...');
    {
      const res = await request
        .post('/api/settings/whatsapp/embedded-signup')
        .send({ code: 'mock_code_123' });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      console.log('   ✅ POST /api/settings/whatsapp/embedded-signup rejected without JWT (401 Unauthorized)\n');
    }

    // =========================================================================
    // Test 2: Missing authorization code & access token rejected (400)
    // =========================================================================
    console.log('2️⃣ Testing Payload Validation (Empty Code / Token) ...');
    {
      const res = await request
        .post('/api/settings/whatsapp/embedded-signup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, 'Bad Request');
      console.log('   ✅ Empty payload correctly rejected (400 Bad Request)\n');
    }

    // =========================================================================
    // Test 3: Multi-tenant protection (Cannot bind to other merchant store) (403)
    // =========================================================================
    console.log('3️⃣ Testing Multi-Tenant Store Ownership Protection ...');
    {
      const res = await request
        .post('/api/settings/whatsapp/embedded-signup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'mock_code_tenant_test',
          storeId: otherStore.id, // belongs to otherUser
        });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      console.log('   ✅ Cross-merchant store update correctly blocked (403 Forbidden)\n');
    }

    // =========================================================================
    // Test 4: Successful 1-Click Embedded Signup completion
    // =========================================================================
    console.log('4️⃣ Testing 1-Click Embedded Signup Onboarding Flow ...');
    {
      const mockWabaId = '109876543210987';
      const mockPhoneId = '101234567890123';

      const res = await request
        .post('/api/settings/whatsapp/embedded-signup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'mock_embedded_auth_code_xyz',
          wabaId: mockWabaId,
          phoneNumberId: mockPhoneId,
          storeId: testStore.id,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.settings.hasMetaAccessToken, true);
      assert.strictEqual(res.body.settings.metaPhoneNumberId, mockPhoneId);
      assert.strictEqual(res.body.settings.metaBusinessAccountId, mockWabaId);
      assert.ok(res.body.settings.metaAccessTokenMasked.includes('••••••••'));

      // Verify DB persistence directly
      const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
      const updatedStore = await prisma.store.findUnique({ where: { id: testStore.id } });

      assert.ok(updatedUser.metaAccessToken.startsWith('EAAG_mock_'));
      assert.strictEqual(updatedUser.metaPhoneNumberId, mockPhoneId);
      assert.strictEqual(updatedUser.metaBusinessAccountId, mockWabaId);

      assert.ok(updatedStore.metaAccessToken.startsWith('EAAG_mock_'));
      assert.strictEqual(updatedStore.metaPhoneNumberId, mockPhoneId);
      assert.strictEqual(updatedStore.metaBusinessAccountId, mockWabaId);

      console.log('   ✅ 1-Click Embedded Signup succeeded & stored permanent token in DB (200 OK)\n');
    }

    // =========================================================================
    // Test 5: GET /api/settings/whatsapp exposes embedded configs & masked token
    // =========================================================================
    console.log('5️⃣ Testing GET /api/settings/whatsapp returns embedded metadata ...');
    {
      const res = await request
        .get('/api/settings/whatsapp')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.settings.hasMetaAccessToken, true);
      assert.ok(res.body.settings.metaAccessTokenMasked);
      assert.strictEqual(typeof res.body.settings.metaAppId, 'string');
      assert.strictEqual(typeof res.body.settings.metaConfigId, 'string');
      assert.strictEqual(typeof res.body.settings.isEmbeddedConfigured, 'boolean');

      console.log('   ✅ GET /api/settings/whatsapp returned configuration state securely\n');
    }

    // =========================================================================
    // Test 6: Disconnect WhatsApp endpoint resets credentials
    // =========================================================================
    console.log('6️⃣ Testing POST /api/settings/whatsapp/disconnect ...');
    {
      const res = await request
        .post('/api/settings/whatsapp/disconnect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ storeId: testStore.id });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.settings.hasMetaAccessToken, false);
      assert.strictEqual(res.body.settings.metaPhoneNumberId, '');
      assert.strictEqual(res.body.settings.metaBusinessAccountId, '');

      // Verify DB record is reset
      const resetUser = await prisma.user.findUnique({ where: { id: testUser.id } });
      const resetStore = await prisma.store.findUnique({ where: { id: testStore.id } });

      assert.strictEqual(resetUser.metaAccessToken, null);
      assert.strictEqual(resetUser.metaPhoneNumberId, null);
      assert.strictEqual(resetUser.metaBusinessAccountId, null);

      assert.strictEqual(resetStore.metaAccessToken, null);
      assert.strictEqual(resetStore.metaPhoneNumberId, null);
      assert.strictEqual(resetStore.metaBusinessAccountId, null);

      console.log('   ✅ POST /api/settings/whatsapp/disconnect successfully cleared credentials in DB\n');
    }

    console.log('🎉 ALL 1-CLICK EMBEDDED SIGNUP BACKEND TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    // Teardown
    if (testStore) {
      await prisma.store.deleteMany({ where: { id: testStore.id } });
    }
    if (otherStore) {
      await prisma.store.deleteMany({ where: { id: otherStore.id } });
    }
    if (testUser) {
      await prisma.user.deleteMany({ where: { id: testUser.id } });
    }
    if (otherUser) {
      await prisma.user.deleteMany({ where: { id: otherUser.id } });
    }
  }
}

runEmbeddedSignupTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Embedded Signup Test Failed:', err);
    process.exit(1);
  });
