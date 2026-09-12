import request from 'supertest';
import assert from 'assert';
import jwt from 'jsonwebtoken';
import app from '../src/server.js';
import prisma from '../src/db/prisma.js';
import config from '../src/config/env.js';

async function runPasswordResetTests() {
  console.log('🧪 Starting Step 20 Password Reset & Recovery Verification Tests ...\n');

  const testEmail = `pwdreset_${Date.now()}@example.com`;
  const initialPassword = 'InitialSecretPass123';
  const newPassword = 'BrandNewSecretPass456';

  let userId;
  let resetToken;

  try {
    // 1. Register test merchant
    console.log('1️⃣ Registering test user for password reset flow ...');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: initialPassword });

    assert.strictEqual(registerRes.status, 201, 'User registration failed');
    userId = registerRes.body.user.id;
    console.log(`   ✅ Test user created: ${testEmail} (ID: ${userId})`);

    // 2. Test forgot-password for non-existent user (Anti-enumeration)
    console.log('2️⃣ Testing POST /api/auth/forgot-password for non-existent user ...');
    const nonExistentRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost_merchant_999@domain.com' });

    assert.strictEqual(nonExistentRes.status, 200, 'Expected 200 OK for anti-enumeration');
    assert.strictEqual(nonExistentRes.body.success, true);
    console.log('   ✅ Anti-enumeration verified: generic 200 OK returned for unknown email');

    // 3. Test forgot-password for valid merchant
    console.log('3️⃣ Testing POST /api/auth/forgot-password for registered user ...');
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testEmail });

    assert.strictEqual(forgotRes.status, 200, 'Expected 200 OK');
    assert.strictEqual(forgotRes.body.success, true);
    assert.ok(forgotRes.body.resetUrl, 'Expected resetUrl returned in test/dev mode');

    // Extract token from resetUrl
    const urlObj = new URL(forgotRes.body.resetUrl);
    resetToken = urlObj.searchParams.get('token');
    assert.ok(resetToken, 'Expected valid token parameter in resetUrl');

    const decoded = jwt.verify(resetToken, config.jwt.secret);
    assert.strictEqual(decoded.userId, userId);
    assert.strictEqual(decoded.type, 'PASSWORD_RESET');
    console.log('   ✅ Password reset token successfully created and verified via JWT');

    // 4. Test reset-password with tampered token
    console.log('4️⃣ Testing POST /api/auth/reset-password with tampered token ...');
    const tamperedRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'invalid.forged.jwt_token', newPassword: 'ValidPassword123' });

    assert.strictEqual(tamperedRes.status, 400, 'Expected 400 Bad Request');
    assert.strictEqual(tamperedRes.body.error, 'InvalidToken');
    console.log('   ✅ Forged reset token rejected with 400 InvalidToken');

    // 5. Test reset-password with short password
    console.log('5️⃣ Testing POST /api/auth/reset-password with short password (<6 chars) ...');
    const shortPassRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword: '123' });

    assert.strictEqual(shortPassRes.status, 400, 'Expected 400 Bad Request');
    console.log('   ✅ Weak password rejected (< 6 chars)');

    // 6. Test successful reset-password
    console.log('6️⃣ Testing successful POST /api/auth/reset-password ...');
    const successResetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword });

    assert.strictEqual(successResetRes.status, 200, 'Expected 200 OK');
    assert.strictEqual(successResetRes.body.success, true);
    console.log('   ✅ Password reset confirmed: database passwordHash updated');

    // 7. Verify login with old password fails
    console.log('7️⃣ Verifying login with old password fails ...');
    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: initialPassword });

    assert.strictEqual(oldLoginRes.status, 401, 'Expected 401 Unauthorized for old password');
    console.log('   ✅ Old password correctly rejected (401 Unauthorized)');

    // 8. Verify login with NEW password succeeds
    console.log('8️⃣ Verifying login with NEW password succeeds ...');
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: newPassword });

    assert.strictEqual(newLoginRes.status, 200, 'Expected 200 OK for new password');
    assert.ok(newLoginRes.body.token, 'Expected new JWT auth session token');
    console.log('   ✅ New password authenticated successfully! Session active.');

    console.log('\n🎉 ALL 8 PASSWORD RESET VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    // Cleanup
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    process.exit(0);
  }
}

runPasswordResetTests();
