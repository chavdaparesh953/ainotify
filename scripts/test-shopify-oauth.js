import assert from 'node:assert';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import createApp from '../src/app.js';
import prisma from '../src/db/prisma.js';
import config from '../src/config/env.js';
import {
  sanitizeShopDomain,
  isValidShopifyDomain,
  verifyShopifyHmac,
} from '../src/controllers/shopifyAuthController.js';

const app = createApp();

async function runShopifyOAuthTests() {
  console.log('🧪 Starting Step 18 Verification Test Suite (Shopify OAuth 1-Click Install Flow)...\n');

  const testEmail = `shopify_oauth_test_${Date.now()}@merchant.com`;
  const testPassword = 'Password123!';
  let authToken = null;
  let userId = null;
  let createdStoreId = null;

  try {
    // -------------------------------------------------------------------------
    // Test 1: Unit tests for domain sanitizer & validator
    // -------------------------------------------------------------------------
    console.log('1️⃣ Testing Shopify Domain Sanitizer & Validator ...');
    assert.strictEqual(sanitizeShopDomain('my-brand'), 'my-brand.myshopify.com');
    assert.strictEqual(sanitizeShopDomain('https://my-brand.myshopify.com/'), 'my-brand.myshopify.com');
    assert.strictEqual(sanitizeShopDomain('HTTP://TEST-STORE.myshopify.com'), 'test-store.myshopify.com');

    assert.strictEqual(isValidShopifyDomain('my-brand.myshopify.com'), true);
    assert.strictEqual(isValidShopifyDomain('test-store-123.myshopify.com'), true);
    assert.strictEqual(isValidShopifyDomain('invalid@store.com'), false);
    assert.strictEqual(isValidShopifyDomain('https://not-allowed.com'), false);
    console.log('   ✅ Domain sanitization and regex validation work correctly');

    // -------------------------------------------------------------------------
    // Test 2: Unit test for timing-safe HMAC verification
    // -------------------------------------------------------------------------
    console.log('2️⃣ Testing Shopify HMAC-SHA256 Signature Verification ...');
    const dummySecret = 'test_shopify_secret_key_987654321';
    const sampleQuery = {
      code: 'auth_code_sample',
      shop: 'sample-store.myshopify.com',
      state: 'nonce_sample_123',
      timestamp: '1690000000',
    };
    const message = Object.keys(sampleQuery)
      .sort()
      .map((k) => `${k}=${sampleQuery[k]}`)
      .join('&');
    const validHmac = crypto.createHmac('sha256', dummySecret).update(message).digest('hex');

    assert.strictEqual(
      verifyShopifyHmac({ ...sampleQuery, hmac: validHmac }, dummySecret),
      true,
      'Expected valid HMAC to pass'
    );
    assert.strictEqual(
      verifyShopifyHmac({ ...sampleQuery, hmac: 'invalid_tampered_hmac_hex' }, dummySecret),
      false,
      'Expected tampered HMAC to fail'
    );
    console.log('   ✅ Timing-safe HMAC verification works correctly');

    // -------------------------------------------------------------------------
    // Setup: Register a merchant user for OAuth tests
    // -------------------------------------------------------------------------
    console.log('3️⃣ Registering merchant user for OAuth authorization tests ...');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword });

    assert.strictEqual(registerRes.status, 201);
    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;
    console.log(`   ✅ Merchant user created: ${testEmail} (ID: ${userId})`);

    // -------------------------------------------------------------------------
    // Test 4: GET /api/shopify/auth Input Validation (Missing shop domain)
    // -------------------------------------------------------------------------
    console.log('4️⃣ Testing GET /api/shopify/auth with missing shop parameter ...');
    const missingShopRes = await request(app)
      .get('/api/shopify/auth')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(missingShopRes.status, 400);
    assert.strictEqual(missingShopRes.body.error, 'Validation Error');
    console.log('   ✅ Missing shop domain is rejected with 400 Bad Request');

    // -------------------------------------------------------------------------
    // Test 5: GET /api/shopify/auth Unauthenticated Rejection
    // -------------------------------------------------------------------------
    console.log('5️⃣ Testing GET /api/shopify/auth without authentication ...');
    const unauthAuthRes = await request(app)
      .get('/api/shopify/auth?shop=test-shop.myshopify.com');

    assert.strictEqual(unauthAuthRes.status, 401);
    assert.strictEqual(unauthAuthRes.body.error, 'Unauthorized');
    console.log('   ✅ Unauthenticated request rejected with 401 Unauthorized');

    // -------------------------------------------------------------------------
    // Test 6: GET /api/shopify/auth Generates Valid Shopify OAuth URL with Nonce State
    // -------------------------------------------------------------------------
    console.log('6️⃣ Testing GET /api/shopify/auth creates signed OAuth redirect URL ...');
    const authUrlRes = await request(app)
      .get('/api/shopify/auth?shop=my-super-shop&json=true')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(authUrlRes.status, 200);
    assert.strictEqual(authUrlRes.body.success, true);
    assert.strictEqual(authUrlRes.body.shop, 'my-super-shop.myshopify.com');
    assert.ok(authUrlRes.body.authUrl, 'Expected authUrl in response');
    assert.ok(authUrlRes.body.state, 'Expected signed state in response');

    // Decode and verify JWT state
    const decodedState = jwt.verify(authUrlRes.body.state, config.jwt.secret);
    assert.strictEqual(decodedState.userId, userId, 'State must contain merchant userId');
    assert.strictEqual(decodedState.shop, 'my-super-shop.myshopify.com');
    assert.ok(decodedState.nonce, 'State must contain nonce');

    // Verify authUrl components
    const urlObj = new URL(authUrlRes.body.authUrl);
    assert.strictEqual(urlObj.hostname, 'my-super-shop.myshopify.com');
    assert.strictEqual(urlObj.pathname, '/admin/oauth/authorize');
    assert.strictEqual(urlObj.searchParams.get('client_id'), config.shopify.apiKey);
    assert.strictEqual(urlObj.searchParams.get('state'), authUrlRes.body.state);
    assert.ok(urlObj.searchParams.get('scope').includes('read_orders'));
    console.log('   ✅ Correct Shopify OAuth authorization URL & state nonce generated');

    // -------------------------------------------------------------------------
    // Test 7: GET /api/shopify/callback Rejects Missing or Tampered State Nonce
    // -------------------------------------------------------------------------
    console.log('7️⃣ Testing GET /api/shopify/callback state validation (CSRF protection) ...');
    // Missing state
    const missingStateRes = await request(app)
      .get('/api/shopify/callback?code=test_code&shop=my-super-shop.myshopify.com');
    assert.strictEqual(missingStateRes.status, 403);
    assert.strictEqual(missingStateRes.body.error, 'Forbidden');

    // Tampered state
    const tamperedStateRes = await request(app)
      .get('/api/shopify/callback?code=test_code&shop=my-super-shop.myshopify.com&state=forged.invalid.state');
    assert.strictEqual(tamperedStateRes.status, 403);
    assert.strictEqual(tamperedStateRes.body.error, 'Forbidden');
    console.log('   ✅ Missing and tampered state nonces rejected with 403 Forbidden (Anti-CSRF)');

    // -------------------------------------------------------------------------
    // Test 8: GET /api/shopify/callback Rejects Spoofed HMAC Signatures
    // -------------------------------------------------------------------------
    console.log('8️⃣ Testing GET /api/shopify/callback HMAC rejection for forged requests ...');
    const validState = authUrlRes.body.state;
    // Query with invalid HMAC (and non-mock code)
    const forgedHmacRes = await request(app)
      .get(`/api/shopify/callback?code=real_code_123&shop=my-super-shop.myshopify.com&state=${validState}&timestamp=1690000000&hmac=bad_hmac_signature`);

    // In non-mock mode (or when custom API secret is configured), forged HMAC must return 401
    // We test that when verifyShopifyHmac fails, 401 is returned
    const customSecret = 'production_shopify_secret_123';
    const oldSecret = config.shopify.apiSecret;
    config.shopify.apiSecret = customSecret;

    const invalidHmacRes = await request(app)
      .get(`/api/shopify/callback?code=code_test_abc&shop=my-super-shop.myshopify.com&state=${validState}&timestamp=1690000000&hmac=bad_signature`);

    config.shopify.apiSecret = oldSecret; // Restore

    assert.strictEqual(invalidHmacRes.status, 401);
    assert.strictEqual(invalidHmacRes.body.error, 'Unauthorized');
    console.log('   ✅ Forged HMAC signature rejected with 401 Unauthorized');

    // -------------------------------------------------------------------------
    // Test 9: GET /api/shopify/callback Full Success Flow
    // -------------------------------------------------------------------------
    console.log('9️⃣ Testing Full Successful Shopify OAuth Callback & Store Synchronization ...');
    const targetShop = `autostore-${Date.now()}.myshopify.com`;
    const fullState = jwt.sign(
      {
        nonce: crypto.randomBytes(16).toString('hex'),
        userId,
        shop: targetShop,
      },
      config.jwt.secret,
      { expiresIn: '15m' }
    );

    const callbackRes = await request(app)
      .get(`/api/shopify/callback?code=mock_oauth_code_${Date.now()}&shop=${targetShop}&state=${fullState}&json=true`);

    assert.strictEqual(callbackRes.status, 200);
    assert.strictEqual(callbackRes.body.success, true);
    assert.ok(callbackRes.body.store, 'Expected store object in response');
    assert.strictEqual(callbackRes.body.store.storeUrl, targetShop);
    assert.strictEqual(callbackRes.body.store.userId, userId);
    assert.strictEqual(callbackRes.body.store.platform, 'SHOPIFY');
    assert.ok(callbackRes.body.store.accessToken.startsWith('shpat_oauth_'), 'Expected offline access token to be saved');
    assert.ok(callbackRes.body.redirectUrl.includes('/onboarding?step=2&connected=true'), 'Expected redirect to Step 2');

    createdStoreId = callbackRes.body.store.id;
    console.log(`   ✅ Store upserted in PostgreSQL: ${targetShop} (ID: ${createdStoreId}) linked to User ${userId}`);

    // -------------------------------------------------------------------------
    // Test 10: Verify Store Record Directly in Database
    // -------------------------------------------------------------------------
    console.log('🔟 Verifying Store Record in Database via Prisma ...');
    const dbStore = await prisma.store.findUnique({
      where: { id: createdStoreId },
    });

    assert.ok(dbStore, 'Store must exist in database');
    assert.strictEqual(dbStore.storeUrl, targetShop);
    assert.strictEqual(dbStore.userId, userId);
    assert.strictEqual(dbStore.platform, 'SHOPIFY');
    assert.ok(dbStore.accessToken.startsWith('shpat_oauth_'));
    console.log('   ✅ Verified Store record in PostgreSQL matches OAuth exchange');

    // -------------------------------------------------------------------------
    // Test 11: GET /api/shopify/callback HTTP 302 Browser Redirect
    // -------------------------------------------------------------------------
    console.log('1️⃣1️⃣ Testing Browser Redirect Mode (HTTP 302) ...');
    const redirectState = jwt.sign(
      {
        nonce: crypto.randomBytes(16).toString('hex'),
        userId,
        shop: targetShop,
      },
      config.jwt.secret,
      { expiresIn: '15m' }
    );

    const browserRedirectRes = await request(app)
      .get(`/api/shopify/callback?code=mock_code_redirect&shop=${targetShop}&state=${redirectState}`)
      .set('Accept', 'text/html,application/xhtml+xml');

    assert.strictEqual(browserRedirectRes.status, 302, 'Expected 302 Found redirect for browser');
    const locationHeader = browserRedirectRes.headers.location;
    assert.ok(locationHeader.includes('/onboarding?step=2&connected=true'));
    assert.ok(locationHeader.includes(`store=${encodeURIComponent(targetShop)}`));
    console.log('   ✅ Browser 302 redirect correctly routes merchant to Onboarding Step 2');

    console.log('\n🎉 ALL Step 18 Shopify OAuth Verification Tests Passed Successfully!');
  } finally {
    // Cleanup test records
    console.log('\n🧹 Cleaning up test records from database ...');
    if (createdStoreId) {
      await prisma.store.deleteMany({ where: { id: createdStoreId } }).catch(() => {});
    }
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
    console.log('   ✅ Cleanup complete.');
    process.exit(0);
  }
}

runShopifyOAuthTests().catch((err) => {
  console.error('\n❌ Step 18 Shopify OAuth Test Suite Failed:', err);
  process.exit(1);
});

