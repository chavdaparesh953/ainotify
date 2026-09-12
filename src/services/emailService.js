import config from '../config/env.js';

/**
 * Transactional Email Dispatcher for WaNotify
 * Supports Resend API (via native fetch) with mock/console fallback in development.
 */
export async function sendPasswordResetEmail({ toEmail, resetUrl }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

  if (resendApiKey && !resendApiKey.includes('mock_') && !resendApiKey.includes('your_')) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `WaNotify Support <${fromEmail}>`,
          to: [toEmail],
          subject: 'Reset your WaNotify password',
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #090d16; color: #f8fafc; padding: 40px 20px; text-align: center;">
              <div style="max-width: 500px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px;">
                <h1 style="color: #10b981; font-size: 24px; margin-bottom: 8px;">WaNotify</h1>
                <h2 style="color: #ffffff; font-size: 20px; font-weight: bold; margin-bottom: 16px;">Password Reset Request</h2>
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                  We received a request to reset your password for your WaNotify account. Click the button below to choose a new password. This link is valid for 1 hour.
                </p>
                <a href="${resetUrl}" style="display: inline-block; background: #10b981; color: #022c22; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
                  Reset Password
                </a>
                <p style="color: #64748b; font-size: 12px; margin-top: 24px; line-height: 1.5;">
                  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
                <div style="margin-top: 20px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #475569;">
                  Or copy and paste this URL into your browser:<br/>
                  <a href="${resetUrl}" style="color: #10b981; word-break: break-all;">${resetUrl}</a>
                </div>
              </div>
            </div>
          `,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[EmailService] ⚠️ Resend API Error:', data);
        return { success: false, error: data };
      }

      console.log(`[EmailService] ✉️ Password reset email dispatched to ${toEmail} via Resend (ID: ${data.id})`);
      return { success: true, messageId: data.id };
    } catch (err) {
      console.error('[EmailService] ❌ Failed to dispatch email via Resend:', err);
      return { success: false, error: err.message };
    }
  }

  // Development / Mock fallback when RESEND_API_KEY is not set
  console.log(`\n======================================================`);
  console.log(`[EmailService ⚡ Mock Email Dispatcher]`);
  console.log(`To: ${toEmail}`);
  console.log(`Subject: Reset your WaNotify password`);
  console.log(`Reset Link: ${resetUrl}`);
  console.log(`======================================================\n`);

  return {
    success: true,
    isMock: true,
    resetUrl,
  };
}

export default {
  sendPasswordResetEmail,
};
