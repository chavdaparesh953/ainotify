import crypto from 'node:crypto';
import prisma from '../src/db/prisma.js';

async function main() {
  console.log('===============================================================');
  console.log('🛒 Simulating Shopify Abandoned Checkout Webhook');
  console.log('===============================================================\n');

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
        accessToken: 'shpat_mock_token_123',
        webhookSecret: 'secret_12345',
      },
    });
  }

  const webhookSecret = store.webhookSecret || 'secret_12345';
  const checkoutToken = `chk_${Date.now().toString().slice(-8)}`;
  const customerPhone = '+919876543210';
  const abandonedUrl = `https://${store.storeUrl}/checkouts/${checkoutToken}?recover=wanotify`;

  const payload = {
    id: Date.now(),
    token: checkoutToken,
    cart_token: `cart_${Date.now()}`,
    email: 'priya.sharma@example.com',
    phone: customerPhone,
    subtotal_price: '2499.00',
    total_price: '2499.00',
    currency: 'INR',
    abandoned_checkout_url: abandonedUrl,
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 min ago
    updated_at: new Date().toISOString(),
    customer: {
      first_name: 'Priya',
      last_name: 'Sharma',
      phone: customerPhone,
    },
    shipping_address: {
      first_name: 'Priya',
      last_name: 'Sharma',
      phone: customerPhone,
      city: 'Delhi',
      country: 'India',
    },
    line_items: [
      {
        id: 101,
        title: 'Floral Summer Dress',
        quantity: 1,
        price: '2499.00',
      },
    ],
  };

  const rawBody = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('base64');

  console.log(`📡 Ingesting checkouts/update webhook for customer ${payload.customer.first_name} (${customerPhone})...`);
  console.log(`   - Checkout URL: ${abandonedUrl}`);

  try {
    const response = await fetch('http://localhost:4000/api/webhooks/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shopify-shop-domain': store.storeUrl,
        'x-shopify-topic': 'checkouts/update',
        'x-shopify-hmac-sha256': hmac,
      },
      body: rawBody,
    });

    const resJson = await response.json().catch(() => ({}));
    console.log(`\n📥 Webhook Server Response (${response.status}):`, resJson);

    if (response.ok) {
      console.log('\n===============================================================');
      console.log('✅ ABANDONED CHECKOUT INGESTION SUCCESSFUL!');
      console.log('===============================================================');
      console.log(`🛒 Cart Token        : ${checkoutToken}`);
      console.log(`👤 Customer          : ${payload.customer.first_name} ${payload.customer.last_name}`);
      console.log(`📱 Customer Phone    : ${customerPhone}`);
      console.log(`🔗 Recovery URL      : ${abandonedUrl}`);
      console.log(`⚡ Delayed BullMQ Job: ${resJson.jobId || 'Queued'}`);
      console.log('---------------------------------------------------------------');
      console.log('👀 Check Dashboard Overview & Message Logs:');
      console.log('   http://localhost:3000/dashboard');
      console.log('===============================================================\n');
    }
  } catch (error) {
    console.error('\n❌ Failed to dispatch to local server:', error.message);
    console.error('Make sure "npm run dev" is running on port 4000.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
