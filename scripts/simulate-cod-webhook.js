/**
 * Simulate COD Order Webhook & Customer Confirmation Flow
 *
 * Usage:
 *   node scripts/simulate-cod-webhook.js
 *   node scripts/simulate-cod-webhook.js --confirm
 *   node scripts/simulate-cod-webhook.js --cancel
 */

import crypto from 'node:crypto';
import prisma from '../src/db/prisma.js';

async function main() {
  const args = process.argv.slice(2);
  const shouldConfirm = args.includes('--confirm');
  const shouldCancel = args.includes('--cancel');

  console.log('===============================================================');
  console.log('📦 Simulating Shopify COD (Cash on Delivery) Order Webhook');
  console.log('===============================================================\n');

  // 1. Get or create a registered store
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
        storeUrl: 'fashionhub-store.myshopify.com',
        accessToken: 'shpat_mock_token_123',
        webhookSecret: 'secret_cod_simulation_123',
      },
    });
  }

  const webhookSecret = store.webhookSecret || 'secret_cod_simulation_123';
  if (!store.webhookSecret) {
    await prisma.store.update({
      where: { id: store.id },
      data: { webhookSecret },
    });
  }

  const orderId = `COD_${Date.now().toString().slice(-6)}`;
  const orderNumber = 1050 + Math.floor(Math.random() * 50);
  const customerPhone = '+919876543210';
  const totalPrice = '1899.00';

  const shopifyPayload = {
    id: orderId,
    order_number: orderNumber,
    name: `#${orderNumber}`,
    gateway: 'Cash on Delivery (COD)',
    financial_status: 'pending',
    total_price: totalPrice,
    currency: 'INR',
    customer: {
      first_name: 'Aarav',
      last_name: 'Sharma',
      phone: customerPhone,
    },
    shipping_address: {
      first_name: 'Aarav',
      last_name: 'Sharma',
      phone: customerPhone,
      city: 'Mumbai',
      country: 'India',
    },
  };

  const rawBody = JSON.stringify(shopifyPayload);
  const hmac = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('base64');

  console.log(`📡 Ingesting signed COD webhook for Order #${orderNumber} (${shopifyPayload.gateway})...`);
  const response = await fetch('http://localhost:4000/api/webhooks/receive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shopify-shop-domain': store.storeUrl,
      'x-shopify-topic': 'orders/create',
      'x-shopify-hmac-sha256': hmac,
    },
    body: rawBody,
  });

  const resJson = await response.json().catch(() => ({}));
  console.log(`📥 Webhook Server Response (${response.status}):`, resJson);

  console.log('\n⏳ Waiting 2 seconds for BullMQ Worker to process COD Interactive Message...');
  await new Promise((r) => setTimeout(r, 2000));

  const verification = await prisma.orderVerification.findFirst({
    where: { orderId },
  });

  if (verification) {
    console.log('\n✅ COD OrderVerification successfully created in PostgreSQL:');
    console.log(`   - ID            : ${verification.id}`);
    console.log(`   - Order Ref     : ${verification.orderNumber || verification.orderId}`);
    console.log(`   - Customer Phone: ${verification.customerPhone}`);
    console.log(`   - Amount        : ${verification.totalAmount}`);
    console.log(`   - Status        : ${verification.status}`);
  }

  // Simulate Button Click if requested
  if (shouldConfirm || shouldCancel) {
    const action = shouldConfirm ? 'cod_confirm' : 'cod_cancel';
    const title = shouldConfirm ? '✅ Confirm Order' : '❌ Cancel Order';

    console.log(`\n📲 Simulating customer WhatsApp button click: "${title}"...`);
    const metaPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                messages: [
                  {
                    from: customerPhone.replace(/\D/g, ''),
                    id: `wamid.SIMULATED_${Date.now()}`,
                    type: 'interactive',
                    interactive: {
                      type: 'button_reply',
                      button_reply: {
                        id: `${action}_${orderId}`,
                        title,
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

    const metaRes = await fetch('http://localhost:4000/api/webhooks/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metaPayload),
    });

    const metaJson = await metaRes.json().catch(() => ({}));
    console.log(`📥 Meta Webhook Response (${metaRes.status}):`, metaJson);

    const updatedVerification = await prisma.orderVerification.findUnique({
      where: { id: verification.id },
    });
    console.log(`\n🎉 Updated Verification Status in Database: ${updatedVerification?.status}`);
  }

  console.log('\n===============================================================');
  console.log('View live in Merchant Dashboard: http://localhost:3000/dashboard/logs');
  console.log('===============================================================\n');

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
