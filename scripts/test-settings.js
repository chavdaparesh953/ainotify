import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/db/prisma.js';
import config from '../src/config/env.js';

async function runSettingsTests() {
  console.log('🧪 Starting Step 8 Verification Test Suite (Merchant WhatsApp Settings API)...\n');
  const app = createApp();
  const request = supertest(app);

  const testEmail = `settings_test_${Date.now()}@merchant.com`;
  let testUser = null;
  let testStore = null;
  let authToken = null;

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
        storeUrl: `store-${Date.now()}.myshopify.com`,
        accessToken: 'shpat_mock_store_token',
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
    console.log('1️⃣ Testing Unauthenticated Access Protection ...');
    {
      const res = await request.get('/api/settings/whatsapp');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      console.log('   ✅ GET /api/settings/whatsapp blocked without JWT (401 Unauthorized)\n');
    }

    // =========================================================================
    // Test 2: GET /api/settings/whatsapp for new merchant
    // =========================================================================
    console.log('2️⃣ Testing GET /api/settings/whatsapp ...');
    {
      const res = await request
        .get('/api/settings/whatsapp')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok('settings' in res.body);
      assert.ok('stores' in res.body);
      assert.strictEqual(res.body.stores.length, 1);
      assert.strictEqual(res.body.stores[0].id, testStore.id);
      console.log('   ✅ Retrieved initial WhatsApp settings and store association (200 OK)\n');
    }

    // =========================================================================
    // Test 3: PUT /api/settings/whatsapp to save credentials
    // =========================================================================
    console.log('3️⃣ Testing PUT /api/settings/whatsapp (Update Credentials) ...');
    {
      const updatePayload = {
        metaPhoneNumberId: '109827364512345',
        metaBusinessAccountId: '108726354129876',
        metaAccessToken: 'EAAG_mock_system_user_token_99998888',
        storeId: testStore.id,
      };

      const res = await request
        .put('/api/settings/whatsapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatePayload);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.settings.metaPhoneNumberId, '109827364512345');
      assert.strictEqual(res.body.settings.metaBusinessAccountId, '108726354129876');
      assert.strictEqual(res.body.settings.hasMetaAccessToken, true);
      // Ensure token is masked, not returned plain
      assert.strictEqual(res.body.settings.metaAccessTokenMasked.startsWith('EAAG••••••••'), true);
      console.log('   ✅ Updated Meta credentials securely with token masking (200 OK)\n');
    }

    // =========================================================================
    // Test 4: Verify Database Persistence & Masked GET
    // =========================================================================
    console.log('4️⃣ Testing Database Persistence & Redaction on GET ...');
    {
      const res = await request
        .get('/api/settings/whatsapp')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.settings.metaPhoneNumberId, '109827364512345');
      assert.strictEqual(res.body.settings.metaBusinessAccountId, '108726354129876');
      assert.strictEqual(res.body.settings.hasMetaAccessToken, true);
      assert.ok(!('metaAccessToken' in res.body.settings), 'Raw token must NEVER leak in API response');

      // Verify in PostgreSQL
      const dbStore = await prisma.store.findUnique({ where: { id: testStore.id } });
      assert.strictEqual(dbStore.metaPhoneNumberId, '109827364512345');
      assert.strictEqual(dbStore.metaAccessToken, 'EAAG_mock_system_user_token_99998888');

      console.log('   ✅ Verified direct database persistence & zero token leakage in GET response\n');
    }

    // =========================================================================
    // Test 5: Prevent cross-tenant store configuration tampering
    // =========================================================================
    console.log('5️⃣ Testing Multi-Tenant Store Ownership Protection ...');
    {
      const foreignStoreId = '00000000-0000-0000-0000-000000000099';
      const res = await request
        .put('/api/settings/whatsapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          storeId: foreignStoreId,
          metaPhoneNumberId: '999999999',
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      console.log('   ✅ Unauthorized cross-tenant storeId update correctly rejected (403 Forbidden)\n');
    }

    console.log('🎉 ALL STEP 8 SETTINGS API VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    // Cleanup
    if (testStore) {
      await prisma.store.delete({ where: { id: testStore.id } }).catch(() => {});
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runSettingsTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Settings test failed:', err);
    process.exit(1);
  });

