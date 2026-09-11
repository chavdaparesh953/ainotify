import assert from 'node:assert';
import crypto from 'node:crypto';
import request from 'supertest';
import createApp from '../src/app.js';
import prisma from '../src/db/prisma.js';
import * as webhookQueueModule from '../src/queues/webhookQueue.js';
import { normalizeStoreUrl } from '../src/utils/url.js';

// In-memory store database for testing
const storesDatabase = new Map();
const usersDatabase = new Map();

// Helper to seed store
function seedStore(store) {
  storesDatabase.set(store.id, { ...store });
  storesDatabase.set(normalizeStoreUrl(store.storeUrl), { ...store });
}

// Seed test merchant & stores
const testUser = {
  id: 'u0000000-0000-0000-0000-000000000001',
  email: 'merchant@example.com',
  passwordHash: 'hash123',
  subscriptionStatus: 'ACTIVE',
};
usersDatabase.set(testUser.id, testUser);

const mockShopifySecret = 'shpss_live_secret_key_abc123';
const mockShopifyStore = {
  id: 'a0000000-0000-0000-0000-000000000001',
  userId: testUser.id,
  platform: 'SHOPIFY',
  storeUrl: 'awesome-store.myshopify.com',
  accessToken: 'shpat_mock_token_123',
  webhookSecret: mockShopifySecret,
  createdAt: new Date(),
  updatedAt: new Date(),
};
seedStore(mockShopifyStore);

const mockWooSecret = 'cs_live_woocommerce_secret_xyz789';
const mockWooStore = {
  id: 'a0000000-0000-0000-0000-000000000002',
  userId: testUser.id,
  platform: 'WOOCOMMERCE',
  storeUrl: 'my-woo-boutique.com',
  accessToken: 'ck_mock_woo_consumer_key',
  webhookSecret: mockWooSecret,
  createdAt: new Date(),
  updatedAt: new Date(),
};
seedStore(mockWooStore);

const mockStoreNoSecret = {
  id: 'a0000000-0000-0000-0000-000000000003',
  userId: testUser.id,
  platform: 'SHOPIFY',
  storeUrl: 'insecure-store.myshopify.com',
  accessToken: 'shpat_insecure',
  webhookSecret: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
seedStore(mockStoreNoSecret);

// Mock Prisma Store methods
prisma.store.findUnique = async ({ where }) => {
  if (where.id && storesDatabase.has(where.id)) {
    return storesDatabase.get(where.id);
  }
  if (where.storeUrl) {
    const norm = normalizeStoreUrl(where.storeUrl);
    if (storesDatabase.has(norm)) return storesDatabase.get(norm);
  }
  return null;
};

prisma.store.findFirst = async ({ where }) => {
  const orConditions = where?.OR || [];
  for (const cond of orConditions) {
    if (cond.storeUrl) {
      const norm = normalizeStoreUrl(cond.storeUrl);
      if (storesDatabase.has(norm)) return storesDatabase.get(norm);
      if (storesDatabase.has(cond.storeUrl)) return storesDatabase.get(cond.storeUrl);
    }
  }
  return null;
};

prisma.store.upsert = async ({ where, update, create }) => {
  const norm = normalizeStoreUrl(where.storeUrl);
  let record = storesDatabase.get(norm);
  if (record) {
    record = { ...record, ...update, updatedAt: new Date() };
  } else {
    record = {
      id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...create,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  seedStore(record);
  return record;
};

prisma.user.findUnique = async ({ where }) => {
  return usersDatabase.get(where.id) || null;
};

prisma.user.create = async ({ data }) => {
  const newUser = { ...data, createdAt: new Date(), updatedAt: new Date() };
  usersDatabase.set(newUser.id, newUser);
  return newUser;
};

// Track queued jobs
const queuedJobs = [];
webhookQueueModule.webhookQueue.add = async (jobName, data, opts) => {
  const job = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: jobName,
    data,
    opts,
  };
  queuedJobs.push(job);
  return job;
};

// Helper: Calculate Base64 HMAC-SHA256
function computeHmac(secret, payload) {
  const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(bodyString).digest('base64');
}

async function runTests() {
  const app = createApp();
  console.log('🧪 Starting Step 2 Verification Test Suite (HMAC Security & Store Onboarding)...\n');

  // Test 1: Healthcheck
  {
    console.log('1️⃣ Testing GET /health ...');
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
    console.log('   ✅ Healthcheck endpoint operational\n');
  }

  // Test 2: Store Onboarding - POST /api/stores/connect
  {
    console.log('2️⃣ Testing Store Onboarding (POST /api/stores/connect) ...');
    
    // Test validation failure
    const invalidRes = await request(app)
      .post('/api/stores/connect')
      .send({ storeUrl: 'https://new-shop.myshopify.com' });
    assert.strictEqual(invalidRes.status, 400);
    assert.strictEqual(invalidRes.body.success, false);
    console.log('   ✅ Rejected incomplete store onboarding payload (400 Bad Request)');

    // Test valid store onboarding
    const validStorePayload = {
      userId: testUser.id,
      storeUrl: 'https://New-Brand-Outlet.myshopify.com/',
      platform: 'SHOPIFY',
      accessToken: 'shpat_onboarded_token_999',
      webhookSecret: 'shpss_onboarded_secret_888',
    };
    const onboardRes = await request(app)
      .post('/api/stores/connect')
      .send(validStorePayload);

    assert.strictEqual(onboardRes.status, 200);
    assert.strictEqual(onboardRes.body.success, true);
    assert.strictEqual(onboardRes.body.store.storeUrl, 'new-brand-outlet.myshopify.com');
    assert.strictEqual(onboardRes.body.store.hasWebhookSecret, true);
    assert.strictEqual(onboardRes.body.store.accessToken, undefined, 'Access token must not be leaked in response');
    console.log('   ✅ Store onboarded and URL normalized to "new-brand-outlet.myshopify.com"\n');
  }

  // Test 3: Missing signature header on webhook
  {
    console.log('3️⃣ Testing POST /api/webhooks/receive without signature header ...');
    const res = await request(app)
      .post('/api/webhooks/receive')
      .set('x-shopify-shop-domain', 'awesome-store.myshopify.com')
      .send({ order_id: 101, total: '50.00' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Unauthorized');
    console.log('   ✅ Unsigned webhook rejected: 401 Unauthorized\n');
  }

  // Test 4: Valid Shopify HMAC Signature
  {
    console.log('4️⃣ Testing POST /api/webhooks/receive with VALID Shopify HMAC ...');
    const payload = {
      id: 8822991100,
      email: 'buyer@shopify-store.com',
      total_price: '249.99',
      shipping_address: { phone: '+1234567890', first_name: 'Alice' },
    };
    const rawJson = JSON.stringify(payload);
    const validHmac = computeHmac(mockShopifySecret, rawJson);

    const res = await request(app)
      .post('/api/webhooks/receive')
      .set('Content-Type', 'application/json')
      .set('x-shopify-shop-domain', 'awesome-store.myshopify.com')
      .set('x-shopify-topic', 'orders/create')
      .set('x-shopify-hmac-sha256', validHmac)
      .send(rawJson);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.platform, 'SHOPIFY');
    assert.ok(res.body.jobId, 'Expected jobId to be returned');
    console.log(`   ✅ Authentic Shopify webhook accepted and queued: Job ${res.body.jobId}\n`);
  }

  // Test 5: Spoofed / Tampered Shopify HMAC Signature
  {
    console.log('5️⃣ Testing POST /api/webhooks/receive with SPOOFED Shopify HMAC ...');
    const payload = { id: 999, total: '1000.00' };
    const forgedHmac = Buffer.from('attacker_fake_signature_hash_bytes_12345').toString('base64');

    const res = await request(app)
      .post('/api/webhooks/receive')
      .set('x-shopify-shop-domain', 'awesome-store.myshopify.com')
      .set('x-shopify-hmac-sha256', forgedHmac)
      .send(payload);

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Invalid Shopify webhook HMAC signature.');
    console.log('   ✅ Spoofed Shopify webhook rejected: 401 Unauthorized\n');
  }

  // Test 6: Valid WooCommerce Webhook Signature
  {
    console.log('6️⃣ Testing POST /api/webhooks/receive with VALID WooCommerce signature ...');
    const wooPayload = {
      id: 54321,
      status: 'completed',
      billing: { phone: '+447911123456', first_name: 'Bob' },
    };
    const rawJson = JSON.stringify(wooPayload);
    const validWooSig = computeHmac(mockWooSecret, rawJson);

    const res = await request(app)
      .post('/api/webhooks/receive')
      .set('Content-Type', 'application/json')
      .set('x-wc-webhook-source', 'https://my-woo-boutique.com/')
      .set('x-wc-webhook-topic', 'order.completed')
      .set('x-wc-webhook-signature', validWooSig)
      .send(rawJson);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.platform, 'WOOCOMMERCE');
    console.log(`   ✅ Authentic WooCommerce webhook accepted and queued: Job ${res.body.jobId}\n`);
  }

  // Test 7: Spoofed WooCommerce Webhook Signature
  {
    console.log('7️⃣ Testing POST /api/webhooks/receive with SPOOFED WooCommerce signature ...');
    const wooPayload = { id: 54321, total: '9999.00' };
    const fakeSig = Buffer.from('fake_woo_signature_bytes_1234567890123').toString('base64');

    const res = await request(app)
      .post('/api/webhooks/receive')
      .set('x-wc-webhook-source', 'https://my-woo-boutique.com/')
      .set('x-wc-webhook-signature', fakeSig)
      .send(wooPayload);

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Invalid WooCommerce webhook signature.');
    console.log('   ✅ Spoofed WooCommerce webhook rejected: 401 Unauthorized\n');
  }

  // Test 8: Store with no webhookSecret configured
  {
    console.log('8️⃣ Testing POST /api/webhooks/receive for store without webhookSecret ...');
    const res = await request(app)
      .post('/api/webhooks/receive')
      .set('x-shopify-shop-domain', 'insecure-store.myshopify.com')
      .set('x-shopify-hmac-sha256', 'dummy_hash==')
      .send({ order_id: 1 });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(
      res.body.message,
      'Store exists but has no webhookSecret configured for HMAC verification.'
    );
    console.log('   ✅ Store without secret rejected: 401 Unauthorized\n');
  }

  // Test 9: Unregistered Store
  {
    console.log('9️⃣ Testing POST /api/webhooks/receive for unregistered domain ...');
    const res = await request(app)
      .post('/api/webhooks/receive')
      .set('x-shopify-shop-domain', 'non-existent-store.myshopify.com')
      .set('x-shopify-hmac-sha256', 'dummy_hash==')
      .send({ order_id: 1 });

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'Store not found');
    console.log('   ✅ Unregistered domain rejected: 404 Store Not Found\n');
  }

  console.log('🎉 ALL 9 VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  await webhookQueueModule.webhookQueue.close().catch(() => {});
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
