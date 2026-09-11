import bcrypt from 'bcryptjs';
import prisma from '../src/db/prisma.js';

async function seedDummyStore() {
  if (process.env.NODE_ENV === 'production') {
    console.error('🚫 SAFETY ERROR: Cannot run seed:dummy in PRODUCTION environment!');
    process.exit(1);
  }

  console.log('🌱 Seeding Dummy Store & Merchant Account...\n');

  try {
    // 1. Upsert Dummy Merchant User
    const email = 'merchant@fashionhub.com';
    const rawPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        subscriptionStatus: 'ACTIVE',
        plan: 'PRO',
      },
      create: {
        email,
        passwordHash,
        subscriptionStatus: 'ACTIVE',
        plan: 'PRO',
      },
    });

    console.log(`✅ Merchant User:`);
    console.log(`   - ID       : ${user.id}`);
    console.log(`   - Email    : ${user.email}`);
    console.log(`   - Password : ${rawPassword}`);
    console.log(`   - Plan     : ${user.plan} (${user.subscriptionStatus})\n`);

    // 2. Upsert Dummy Shopify Store
    const storeUrl = 'test-brand.myshopify.com';
    const webhookSecret = 'secret_12345';
    const accessToken = 'shpat_test_access_token_12345';

    const store = await prisma.store.upsert({
      where: { storeUrl },
      update: {
        userId: user.id,
        platform: 'SHOPIFY',
        accessToken,
        webhookSecret,
      },
      create: {
        userId: user.id,
        platform: 'SHOPIFY',
        storeUrl,
        accessToken,
        webhookSecret,
      },
    });

    console.log(`✅ Dummy Store Configured:`);
    console.log(`   - ID             : ${store.id}`);
    console.log(`   - Store URL      : ${store.storeUrl}`);
    console.log(`   - Platform       : ${store.platform}`);
    console.log(`   - Webhook Secret : ${store.webhookSecret}`);
    console.log(`   - Linked User ID : ${store.userId}\n`);

    console.log('🎉 Seed completed successfully!');
    console.log('   You can now run: npm run simulate:webhook\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDummyStore();
