import crypto from 'node:crypto';
import prisma from '../src/db/prisma.js';

async function simulateWebhook() {
  const targetUrl = process.env.WEBHOOK_TARGET_URL || 'http://localhost:4000/api/webhooks/receive';

  // Check if store exists in DB or fallback
  let store = await prisma.store.findFirst({
    where: { platform: 'SHOPIFY' },
    include: { user: true },
  });

  if (!store) {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'merchant@fashionhub.com',
          passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
          plan: 'PRO',
          subscriptionStatus: 'ACTIVE',
        },
      });
    }

    store = await prisma.store.create({
      data: {
        userId: user.id,
        platform: 'SHOPIFY',
        storeUrl: 'test-brand.myshopify.com',
        accessToken: 'shpat_test_access_token_12345',
        webhookSecret: 'secret_12345',
      },
    });
  }

  const storeDomain = store.storeUrl || 'test-brand.myshopify.com';
  const webhookSecret = store.webhookSecret || 'secret_12345';
  const topic = 'orders/create';

  // Check for command line phone number override
  const args = process.argv.slice(2);
  const customPhoneArg = args.find((arg) => arg.startsWith('+') || /^\d{10,15}$/.test(arg));
  const customerPhone = customPhoneArg || '+919876543210';

  console.log('===============================================================');
  console.log('🚀 Shopify Webhook Simulation Script (Local End-to-End Pipeline)');
  console.log('===============================================================\n');

  // 1. Construct Realistic Shopify orders/create Payload
  const orderId = 82098290000 + Math.floor(Math.random() * 90000);
  const orderNumber = 1000 + Math.floor(Math.random() * 9000);

  const payload = {
    id: orderId,
    admin_graphql_api_id: `gid://shopify/Order/${orderId}`,
    order_number: orderNumber,
    name: `#${orderNumber}`,
    total_price: '149.99',
    subtotal_price: '139.99',
    total_tax: '10.00',
    currency: 'USD',
    financial_status: 'paid',
    confirmed: true,
    created_at: new Date().toISOString(),
    customer: {
      id: 9918273645,
      first_name: 'Aarav',
      last_name: 'Sharma',
      email: 'aarav.sharma@example.com',
      phone: customerPhone,
    },
    shipping_address: {
      first_name: 'Aarav',
      last_name: 'Sharma',
      phone: customerPhone,
      address1: '123 Commercial Street',
      city: 'Bengaluru',
      province: 'Karnataka',
      country: 'India',
      zip: '560001',
    },
    billing_address: {
      first_name: 'Aarav',
      last_name: 'Sharma',
      phone: customerPhone,
      address1: '123 Commercial Street',
      city: 'Bengaluru',
      country: 'India',
    },
    line_items: [
      {
        id: 77889911,
        title: 'Premium Noise-Canceling Wireless Headphones',
        quantity: 1,
        price: '149.99',
        sku: 'WL-HEADPHONE-PRO',
      },
    ],
  };

  const rawPayload = JSON.stringify(payload);

  // 2. Cryptographic HMAC-SHA256 Generation
  console.log('🔐 Computing authentic HMAC-SHA256 signature...');
  const hmacSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawPayload)
    .digest('base64');

  console.log(`   - Store Domain: ${storeDomain}`);
  console.log(`   - Secret Key  : ${webhookSecret}`);
  console.log(`   - Signature   : ${hmacSignature}\n`);

  // 3. Dispatch POST Request
  console.log(`📡 Dispatching signed webhook to: ${targetUrl}`);
  console.log(`   - Header: X-Shopify-Shop-Domain: ${storeDomain}`);
  console.log(`   - Header: X-Shopify-Topic: ${topic}`);
  console.log(`   - Header: X-Shopify-Hmac-Sha256: ${hmacSignature}\n`);

  try {
    const startTime = Date.now();
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': storeDomain,
        'X-Shopify-Topic': topic,
        'X-Shopify-Hmac-Sha256': hmacSignature,
      },
      body: rawPayload,
    });

    const elapsedMs = Date.now() - startTime;
    const responseData = await response.json().catch(() => ({}));

    console.log(`📥 Server Response: HTTP ${response.status} (${elapsedMs}ms)`);
    console.log(JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n===============================================================');
      console.log('✅ WEBHOOK INGESTION & PIPELINE HANDOFF SUCCESSFUL!');
      console.log('===============================================================');
      console.log(`📦 Simulated Order   : ${payload.name} ($${payload.total_price})`);
      console.log(`👤 Customer          : ${payload.customer.first_name} ${payload.customer.last_name}`);
      console.log(`📱 Customer Phone    : ${payload.customer.phone}`);
      console.log(`⚡ BullMQ Job ID     : ${responseData.jobId}`);
      console.log('---------------------------------------------------------------');
      console.log('👀 NEXT STEP - VERIFY ON REACT DASHBOARD:');
      console.log('   1. Open: http://localhost:3000/dashboard/logs');
      console.log('   2. Look for Customer Phone in the Message Logs table!');
      console.log('===============================================================\n');
    } else {
      console.error(`\n❌ Server returned error status ${response.status}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Failed to connect to local server:');
    console.error(`   ${error.message}`);
    console.error('\n⚠️  Ensure the backend server is running on port 4000:');
    console.error('   npm run dev');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

simulateWebhook();
