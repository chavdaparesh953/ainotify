import crypto from 'node:crypto';

/**
 * Custom error class for SMS delivery and provider failures
 */
export class SmsApiError extends Error {
  constructor(message, { provider, statusCode, details } = {}) {
    super(message);
    this.name = 'SmsApiError';
    this.provider = provider;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Strips WhatsApp formatting characters (bold, italic, strikethrough, monospace)
 * to produce clean plain-text suitable for standard SMS.
 *
 * @param {string} text
 * @returns {string} Clean plain-text message
 */
export function stripWhatsAppMarkdown(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    // Replace ```code``` with code
    .replace(/```([\s\S]*?)```/g, '$1')
    // Replace `inline code` with inline code
    .replace(/`([^`]+)`/g, '$1')
    // Replace *bold* with bold (non-empty)
    .replace(/\*([^*\n]+)\*/g, '$1')
    // Replace _italic_ with italic
    .replace(/_([^_\n]+)_/g, '$1')
    // Replace ~strikethrough~ with strikethrough
    .replace(/~([^~\n]+)~/g, '$1')
    // Replace bullet points like "• " or "* " at line start with "- "
    .replace(/^[•*]\s+/gm, '- ')
    // Normalize excessive newlines to double newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Dispatches an SMS using Twilio Programmable Messaging API
 *
 * @param {Object} params
 * @param {string} params.accountSid - Twilio Account SID
 * @param {string} params.authToken - Twilio Auth Token
 * @param {string} [params.fromNumber] - Twilio phone number or Alphanumeric Sender ID
 * @param {string} params.to - Recipient phone number (E.164)
 * @param {string} params.message - Message body text
 * @returns {Promise<{ messageId: string, provider: 'TWILIO', success: true }>}
 */
export async function sendTwilioSms({ accountSid, authToken, fromNumber, to, message }) {
  if (!accountSid || !authToken) {
    throw new SmsApiError('Twilio Account SID and Auth Token are required.', { provider: 'TWILIO', statusCode: 400 });
  }
  if (!to) {
    throw new SmsApiError('Recipient phone number is required.', { provider: 'TWILIO', statusCode: 400 });
  }
  if (!message) {
    throw new SmsApiError('SMS message body is required.', { provider: 'TWILIO', statusCode: 400 });
  }

  const cleanMessage = stripWhatsAppMarkdown(message);

  // Mock / Sandbox Mode for testing or development
  const isMock =
    accountSid.startsWith('mock_') ||
    authToken.startsWith('mock_') ||
    accountSid === 'AC_TEST_ACCOUNT_SID' ||
    process.env.NODE_ENV === 'test';

  if (isMock) {
    const mockSid = `SM_${crypto.randomBytes(16).toString('hex')}`;
    console.log(`[smsService] ⚡ [Mock Twilio] Sent to ${to} from ${fromNumber || 'WaNotify'}: "${cleanMessage.slice(0, 50)}..." (SID: ${mockSid})`);
    return {
      success: true,
      messageId: mockSid,
      provider: 'TWILIO',
      simulated: true,
      to,
      from: fromNumber || 'WaNotify',
    };
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
  const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;

  const formData = new URLSearchParams();
  formData.append('To', to.startsWith('+') ? to : `+${to}`);
  if (fromNumber) {
    formData.append('From', fromNumber);
  }
  formData.append('Body', cleanMessage);

  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: formData.toString(),
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errMsg = responseData.message || responseData.error_message || `Twilio HTTP ${response.status}`;
    throw new SmsApiError(`Twilio dispatch failed: ${errMsg}`, {
      provider: 'TWILIO',
      statusCode: response.status,
      details: responseData,
    });
  }

  return {
    success: true,
    messageId: responseData.sid,
    provider: 'TWILIO',
    status: responseData.status,
    to,
    from: responseData.from,
  };
}

/**
 * Dispatches an SMS using Fast2SMS bulkV2 API
 *
 * @param {Object} params
 * @param {string} params.apiKey - Fast2SMS Authorization Key
 * @param {string} [params.senderId] - Approved 6-character DLT Sender ID
 * @param {string} params.to - Recipient 10-digit mobile number or numbers string
 * @param {string} params.message - Plain text message body
 * @returns {Promise<{ messageId: string, provider: 'FAST2SMS', success: true }>}
 */
export async function sendFast2Sms({ apiKey, senderId, to, message }) {
  if (!apiKey) {
    throw new SmsApiError('Fast2SMS API authorization key is required.', { provider: 'FAST2SMS', statusCode: 400 });
  }
  if (!to) {
    throw new SmsApiError('Recipient phone number is required.', { provider: 'FAST2SMS', statusCode: 400 });
  }
  if (!message) {
    throw new SmsApiError('SMS message body is required.', { provider: 'FAST2SMS', statusCode: 400 });
  }

  const cleanMessage = stripWhatsAppMarkdown(message);
  // Fast2SMS typically expects domestic 10-digit number without country code for India (+91)
  let formattedNumber = to.replace(/\D/g, '');
  if (formattedNumber.startsWith('91') && formattedNumber.length === 12) {
    formattedNumber = formattedNumber.slice(2);
  }

  // Mock / Sandbox Mode for testing or development
  const isMock =
    apiKey.startsWith('mock_') ||
    apiKey === 'fast2sms_mock_api_key' ||
    process.env.NODE_ENV === 'test';

  if (isMock) {
    const mockReqId = `FST_${crypto.randomBytes(12).toString('hex')}`;
    console.log(`[smsService] ⚡ [Mock Fast2SMS] Sent to ${formattedNumber} (Sender: ${senderId || 'FSTSMS'}): "${cleanMessage.slice(0, 50)}..." (ID: ${mockReqId})`);
    return {
      success: true,
      messageId: mockReqId,
      provider: 'FAST2SMS',
      simulated: true,
      to: formattedNumber,
      senderId: senderId || 'FSTSMS',
    };
  }

  const requestBody = {
    route: senderId ? 'dlt' : 'q',
    message: cleanMessage,
    language: 'english',
    flash: 0,
    numbers: formattedNumber,
  };

  if (senderId) {
    requestBody.sender_id = senderId;
  }

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok || responseData.return === false) {
    const errMsg = (responseData.message && responseData.message[0]) || responseData.message || `Fast2SMS HTTP ${response.status}`;
    throw new SmsApiError(`Fast2SMS dispatch failed: ${errMsg}`, {
      provider: 'FAST2SMS',
      statusCode: response.status,
      details: responseData,
    });
  }

  const messageId = responseData.request_id || `FST_${Date.now()}`;

  return {
    success: true,
    messageId,
    provider: 'FAST2SMS',
    message: responseData.message,
    to: formattedNumber,
  };
}

/**
 * Universal SMS Dispatcher
 * Routes SMS to configured store provider (Twilio or Fast2SMS).
 *
 * @param {Object} params
 * @param {'TWILIO'|'FAST2SMS'} params.provider
 * @param {Object} params.credentials - JSON object with provider API keys / tokens
 * @param {string} [params.senderId] - Optional sender ID or phone number
 * @param {string} params.to - Recipient phone number
 * @param {string} params.message - SMS message text
 * @returns {Promise<{ success: boolean, messageId: string, provider: string }>}
 */
export async function sendSms({ provider, credentials = {}, senderId = null, to, message }) {
  if (!provider) {
    throw new SmsApiError('No SMS provider configured for this store.', { statusCode: 400 });
  }

  const cleanMessage = stripWhatsAppMarkdown(message);

  if (provider === 'TWILIO') {
    const accountSid = credentials.accountSid || credentials.account_sid;
    const authToken = credentials.authToken || credentials.auth_token;
    const fromNumber = senderId || credentials.fromNumber || credentials.from;

    return sendTwilioSms({
      accountSid,
      authToken,
      fromNumber,
      to,
      message: cleanMessage,
    });
  }

  if (provider === 'FAST2SMS') {
    const apiKey = credentials.apiKey || credentials.api_key;
    const resolvedSenderId = senderId || credentials.senderId || credentials.sender_id;

    return sendFast2Sms({
      apiKey,
      senderId: resolvedSenderId,
      to,
      message: cleanMessage,
    });
  }

  throw new SmsApiError(`Unsupported SMS provider "${provider}". Supported providers are TWILIO and FAST2SMS.`, {
    provider,
    statusCode: 400,
  });
}

/**
 * Tests SMS provider configuration by sending a verification ping
 *
 * @param {Object} params
 * @param {'TWILIO'|'FAST2SMS'} params.provider
 * @param {Object} params.credentials
 * @param {string} [params.senderId]
 * @param {string} params.testPhone
 * @param {string} [params.testMessage]
 * @returns {Promise<{ success: boolean, messageId: string, provider: string }>}
 */
export async function testSmsConnection({ provider, credentials, senderId, testPhone, testMessage }) {
  const message =
    testMessage ||
    `[WaNotify Verification] This is a live test message confirming your ${provider} SMS integration is active and verified!`;

  return sendSms({
    provider,
    credentials,
    senderId,
    to: testPhone,
    message,
  });
}

export default {
  stripWhatsAppMarkdown,
  sendTwilioSms,
  sendFast2Sms,
  sendSms,
  testSmsConnection,
  SmsApiError,
};
