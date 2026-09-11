import assert from 'node:assert';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import createApp from '../src/app.js';
import prisma from '../src/db/prisma.js';
import * as webhookQueueModule from '../src/queues/webhookQueue.js';

// In-memory test store
const usersDB = new Map();
const storesDB = new Map();
const messageLogsDB = [];

// Seed an initial user
const initialPasswordHash = bcrypt.hashSync('Password123!', 10);
const merchantA = {
  id: 'user_merchant_aaa',
  email: 'merchant.a@store.com',
  passwordHash: initialPasswordHash,
  subscriptionStatus: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};
usersDB.set(merchantA.email, merchantA);
usersDB.set(merchantA.id, merchantA);

const merchantB = {
  id: 'user_merchant_bbb',
  email: 'merchant.b@store.com',
  passwordHash: initialPasswordHash,
  subscriptionStatus: 'TRIAL',
  createdAt: new Date(),
  updatedAt: new Date(),
};
usersDB.set(merchantB.email, merchantB);
usersDB.set(merchantB.id, merchantB);

// Seed stores
const storeA1 = {
  id: 'store_aaa_001',
  userId: merchantA.id,
  platform: 'SHOPIFY',
  storeUrl: 'merchant-a-shop.myshopify.com',
  accessToken: 'shpat_secret_access_token_123',
  webhookSecret: 'shpss_secret_webhook_key_456',
  createdAt: new Date(),
  updatedAt: new Date(),
};
storesDB.set(storeA1.id, storeA1);

const storeB1 = {
  id: 'store_bbb_001',
  userId: merchantB.id,
  platform: 'WOOCOMMERCE',
  storeUrl: 'merchant-b-boutique.com',
  accessToken: 'ck_secret_woo_key',
  webhookSecret: 'cs_secret_woo_secret',
  createdAt: new Date(),
  updatedAt: new Date(),
};
storesDB.set(storeB1.id, storeB1);

// Seed message logs
messageLogsDB.push(
  {
    id: 'log_001',
    storeId: storeA1.id,
    customerPhone: '15551234567',
    status: 'SENT',
    channel: 'WHATSAPP',
    metadata: { jobId: 'job_1', messageId: 'wamid_1' },
    timestamp: new Date(),
    createdAt: new Date(Date.now() - 3000),
  },
  {
    id: 'log_002',
    storeId: storeA1.id,
    customerPhone: '15559876543',
    status: 'SENT',
    channel: 'WHATSAPP',
    metadata: { jobId: 'job_2', messageId: 'wamid_2' },
    timestamp: new Date(),
    createdAt: new Date(Date.now() - 2000),
  },
  {
    id: 'log_003',
    storeId: storeA1.id,
    customerPhone: '15550000000',
    status: 'FAILED',
    channel: 'WHATSAPP',
    metadata: { jobId: 'job_3', error: 'Undeliverable number' },
    timestamp: new Date(),
    createdAt: new Date(Date.now() - 1000),
  },
  {
    id: 'log_004',
    storeId: storeB1.id, // Belongs to Merchant B!
    customerPhone: '447700900123',
    status: 'SENT',
    channel: 'WHATSAPP',
    metadata: { jobId: 'job_4' },
    timestamp: new Date(),
    createdAt: new Date(),
  }
);

// Prisma mocking for tests
prisma.user.findUnique = async ({ where }) => {
  if (where.email) return usersDB.get(where.email) || null;
  if (where.id) return usersDB.get(where.id) || null;
  return null;
};

prisma.user.create = async ({ data }) => {
  const newUser = {
    id: `user_${Date.now()}`,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  usersDB.set(newUser.email, newUser);
  usersDB.set(newUser.id, newUser);
  return newUser;
};

prisma.store.findMany = async ({ where, select }) => {
  const matching = [];
  for (const store of storesDB.values()) {
    if (!where.userId || store.userId === where.userId) {
      const msgCount = messageLogsDB.filter((l) => l.storeId === store.id).length;
      matching.push({
        ...store,
        _count: { messageLogs: msgCount },
      });
    }
  }
  return matching;
};

prisma.messageLog.groupBy = async ({ by, where }) => {
  const allowedStoreIds = where?.storeId?.in || [];
  const counts = {};

  for (const log of messageLogsDB) {
    if (allowedStoreIds.includes(log.storeId)) {
      counts[log.status] = (counts[log.status] || 0) + 1;
    }
  }

  return Object.entries(counts).map(([status, count]) => ({
    status,
    _count: { status: count },
  }));
};

prisma.messageLog.count = async ({ where }) => {
  const allowedStoreIds = where?.storeId?.in || (where?.storeId ? [where.storeId] : []);
  return messageLogsDB.filter((l) => {
    if (where?.storeId && typeof where.storeId === 'string' && l.storeId !== where.storeId) return false;
    if (allowedStoreIds.length > 0 && !allowedStoreIds.includes(l.storeId)) return false;
    if (where?.status && l.status !== where.status) return false;
    return true;
  }).length;
};

prisma.messageLog.findMany = async ({ where, skip = 0, take = 50, include }) => {
  const allowedStoreIds = where?.storeId?.in || (where?.storeId ? [where.storeId] : []);
  const filtered = messageLogsDB
    .filter((l) => {
      if (where?.storeId && typeof where.storeId === 'string' && l.storeId !== where.storeId) return false;
      if (allowedStoreIds.length > 0 && !allowedStoreIds.includes(l.storeId)) return false;
      if (where?.status && l.status !== where.status) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(skip, skip + take)
    .map((l) => ({
      ...l,
      ...(include?.store && {
        store: {
          id: l.storeId,
          platform: storesDB.get(l.storeId)?.platform || 'SHOPIFY',
          storeUrl: storesDB.get(l.storeId)?.storeUrl || 'store.myshopify.com',
        },
      }),
    }));

  return filtered;
};

async function runDashboardTests() {
  const app = createApp();
  console.log('🧪 Starting Step 4 Verification Test Suite (Merchant Auth & Dashboard APIs)...\n');

  let merchantAToken = null;

  // =========================================================================
  // Section 1: Merchant Registration
  // =========================================================================
  console.log('1️⃣ Testing POST /api/auth/register ...');
  {
    // 1a. Validation error (short password)
    const badRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'newbie@store.com', password: '123' });
    assert.strictEqual(badRes.status, 400);
    assert.strictEqual(badRes.body.success, false);
    console.log('   ✅ Rejected password shorter than 6 characters (400 Bad Request)');

    // 1b. Successful registration
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new.merchant@retailer.com', password: 'ValidPassword123!' });

    assert.strictEqual(regRes.status, 201);
    assert.strictEqual(regRes.body.success, true);
    assert.ok(regRes.body.token, 'Expected JWT token in registration response');
    assert.strictEqual(regRes.body.user.email, 'new.merchant@retailer.com');
    assert.strictEqual(regRes.body.user.passwordHash, undefined, 'passwordHash must never be exposed');
    console.log('   ✅ Successfully registered new user and issued JWT token (201 Created)');

    // 1c. Duplicate registration rejection
    const dupRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new.merchant@retailer.com', password: 'ValidPassword123!' });
    assert.strictEqual(dupRes.status, 409);
    assert.strictEqual(dupRes.body.error, 'Conflict');
    console.log('   ✅ Rejected duplicate email registration (409 Conflict)\n');
  }

  // =========================================================================
  // Section 2: Merchant Login
  // =========================================================================
  console.log('2️⃣ Testing POST /api/auth/login ...');
  {
    // 2a. Invalid password
    const wrongPassRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'merchant.a@store.com', password: 'WrongPassword!' });
    assert.strictEqual(wrongPassRes.status, 401);
    assert.strictEqual(wrongPassRes.body.message, 'Invalid email or password.');
    console.log('   ✅ Rejected incorrect password (401 Unauthorized)');

    // 2b. Successful login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'merchant.a@store.com', password: 'Password123!' });

    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.body.success, true);
    assert.ok(loginRes.body.token, 'Expected JWT token on login');
    assert.strictEqual(loginRes.body.user.id, merchantA.id);
    merchantAToken = loginRes.body.token;
    console.log('   ✅ Successful login: JWT token received (200 OK)');

    // 2c. GET /api/auth/me with token
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${merchantAToken}`);

    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.user.email, 'merchant.a@store.com');
    console.log('   ✅ GET /api/auth/me verified user profile\n');
  }

  // =========================================================================
  // Section 3: JWT Middleware Protection
  // =========================================================================
  console.log('3️⃣ Testing JWT Middleware Protection ...');
  {
    // Missing Authorization header
    const noTokenRes = await request(app).get('/api/dashboard/stats');
    assert.strictEqual(noTokenRes.status, 401);
    assert.strictEqual(noTokenRes.body.error, 'Unauthorized');
    console.log('   ✅ Unauthenticated request rejected (401 Unauthorized)');

    // Malformed token header
    const badHeaderRes = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', 'InvalidFormatHeader');
    assert.strictEqual(badHeaderRes.status, 401);
    console.log('   ✅ Malformed header format rejected (401 Unauthorized)');

    // Forged/Invalid JWT token
    const forgedTokenRes = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', 'Bearer forged.fake.jwt_token');
    assert.strictEqual(forgedTokenRes.status, 403);
    assert.strictEqual(forgedTokenRes.body.error, 'Forbidden');
    console.log('   ✅ Forged/Tampered JWT rejected (403 Forbidden)\n');
  }

  // =========================================================================
  // Section 4: Dashboard Analytics (GET /api/dashboard/stats)
  // =========================================================================
  console.log('4️⃣ Testing GET /api/dashboard/stats ...');
  {
    const statsRes = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${merchantAToken}`);

    assert.strictEqual(statsRes.status, 200);
    assert.strictEqual(statsRes.body.success, true);
    const { stats } = statsRes.body;

    // Merchant A owns Store A1 (has 2 SENT, 1 FAILED, 0 PENDING)
    assert.strictEqual(stats.totalMessages, 3);
    assert.strictEqual(stats.sent, 2);
    assert.strictEqual(stats.failed, 1);
    assert.strictEqual(stats.pending, 0);
    assert.strictEqual(stats.deliveryRate, '66.67%');
    assert.strictEqual(stats.totalStores, 1);
    console.log('   ✅ Grouped stats accurately computed: 2 Sent, 1 Failed, 66.67% Delivery Rate (Multi-tenant scoped)\n');
  }

  // =========================================================================
  // Section 5: Recent Message Logs (GET /api/dashboard/recent-logs)
  // =========================================================================
  console.log('5️⃣ Testing GET /api/dashboard/recent-logs ...');
  {
    // 5a. Standard retrieval
    const logsRes = await request(app)
      .get('/api/dashboard/recent-logs?page=1&limit=10')
      .set('Authorization', `Bearer ${merchantAToken}`);

    assert.strictEqual(logsRes.status, 200);
    assert.strictEqual(logsRes.body.success, true);
    assert.strictEqual(logsRes.body.pagination.total, 3);
    assert.strictEqual(logsRes.body.pagination.page, 1);
    assert.strictEqual(logsRes.body.logs.length, 3);
    assert.strictEqual(logsRes.body.logs[0].store.platform, 'SHOPIFY');
    console.log('   ✅ Retrieved paginated recent logs with store association');

    // 5b. Filter by status=SENT
    const sentOnlyRes = await request(app)
      .get('/api/dashboard/recent-logs?status=SENT')
      .set('Authorization', `Bearer ${merchantAToken}`);

    assert.strictEqual(sentOnlyRes.status, 200);
    assert.strictEqual(sentOnlyRes.body.pagination.total, 2);
    assert.ok(sentOnlyRes.body.logs.every((l) => l.status === 'SENT'));
    console.log('   ✅ Filtered logs by status=SENT (2 logs returned)');

    // 5c. Multi-tenant storeId restriction (prevent querying another merchant's store)
    const crossStoreRes = await request(app)
      .get(`/api/dashboard/recent-logs?storeId=${storeB1.id}`) // Merchant B's store!
      .set('Authorization', `Bearer ${merchantAToken}`);

    assert.strictEqual(crossStoreRes.status, 403);
    assert.strictEqual(crossStoreRes.body.error, 'Forbidden');
    console.log('   ✅ Cross-tenant storeId filter blocked (403 Forbidden)\n');
  }

  // =========================================================================
  // Section 6: Connected Stores (GET /api/dashboard/stores)
  // =========================================================================
  console.log('6️⃣ Testing GET /api/dashboard/stores ...');
  {
    const storesRes = await request(app)
      .get('/api/dashboard/stores')
      .set('Authorization', `Bearer ${merchantAToken}`);

    assert.strictEqual(storesRes.status, 200);
    assert.strictEqual(storesRes.body.success, true);
    assert.strictEqual(storesRes.body.total, 1);

    const store = storesRes.body.stores[0];
    assert.strictEqual(store.id, storeA1.id);
    assert.strictEqual(store.storeUrl, 'merchant-a-shop.myshopify.com');
    assert.strictEqual(store.platform, 'SHOPIFY');
    assert.strictEqual(store.hasWebhookSecret, true);
    assert.strictEqual(store.totalMessages, 3);

    // CRITICAL: Verify secrets are not leaked
    assert.strictEqual(store.accessToken, undefined, 'accessToken must NOT be present in response');
    assert.strictEqual(store.webhookSecret, undefined, 'webhookSecret must NOT be present in response');
    console.log('   ✅ Connected stores listed with secrets strictly redacted\n');
  }

  console.log('🎉 ALL STEP 4 VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  await webhookQueueModule.webhookQueue.close().catch(() => {});
  process.exit(0);
}

runDashboardTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
