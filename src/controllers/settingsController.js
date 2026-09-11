import prisma from '../db/prisma.js';
import { sendMessage, WhatsAppApiError } from '../services/whatsappService.js';
import { sendSms, testSmsConnection as testSmsService, SmsApiError } from '../services/smsService.js';
import { normalizePhoneNumber } from '../utils/templateMapper.js';
import config from '../config/env.js';

/**
 * Helper to mask sensitive Meta access tokens
 * e.g. "EAAG12345678abcdef" -> "EAAG••••••••cdef"
 */
function maskToken(token) {
  if (!token || typeof token !== 'string') return null;
  const trimmed = token.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••••••${trimmed.slice(-4)}`;
}

/**
 * Retrieve current merchant WhatsApp settings
 * GET /api/settings/whatsapp
 */
export async function getWhatsAppSettings(req, res, next) {
  try {
    const userId = req.user.id;

    // Fetch user and all stores owned by the merchant
    const [user, stores] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          metaPhoneNumberId: true,
          metaBusinessAccountId: true,
          metaAccessToken: true,
        },
      }),
      prisma.store.findMany({
        where: { userId },
        select: {
          id: true,
          storeUrl: true,
          platform: true,
          metaPhoneNumberId: true,
          metaBusinessAccountId: true,
          metaAccessToken: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant user record not found.',
      });
    }

    // Determine primary store settings or fallback to user settings
    const primaryStore = stores[0] || null;

    const resolvedPhoneNumberId =
      primaryStore?.metaPhoneNumberId || user.metaPhoneNumberId || config.meta.phoneNumberId || '';
    const resolvedBusinessAccountId =
      primaryStore?.metaBusinessAccountId || user.metaBusinessAccountId || config.meta.businessAccountId || '';
    const activeToken =
      primaryStore?.metaAccessToken || user.metaAccessToken || (config.meta.accessToken.startsWith('mock_') ? null : config.meta.accessToken);

    const sanitizedStores = stores.map((s) => ({
      id: s.id,
      storeUrl: s.storeUrl,
      platform: s.platform,
      metaPhoneNumberId: s.metaPhoneNumberId || '',
      metaBusinessAccountId: s.metaBusinessAccountId || '',
      hasMetaAccessToken: Boolean(s.metaAccessToken),
      metaAccessTokenMasked: maskToken(s.metaAccessToken),
    }));

    return res.status(200).json({
      success: true,
      settings: {
        metaPhoneNumberId: resolvedPhoneNumberId,
        metaBusinessAccountId: resolvedBusinessAccountId,
        hasMetaAccessToken: Boolean(activeToken),
        metaAccessTokenMasked: maskToken(activeToken),
        selectedStoreId: primaryStore?.id || null,
        isSystemFallback: !user.metaAccessToken && !primaryStore?.metaAccessToken,
      },
      stores: sanitizedStores,
    });
  } catch (error) {
    console.error('[getWhatsAppSettings Error]', error);
    next(error);
  }
}

/**
 * Update merchant WhatsApp settings
 * PUT /api/settings/whatsapp
 *
 * Body parameters:
 * - metaPhoneNumberId: string (e.g. "104827592817293")
 * - metaBusinessAccountId: string (e.g. "103948572619482")
 * - metaAccessToken: string (optional, only updated if provided and non-empty)
 * - storeId: uuid (optional, target specific store)
 */
export async function updateWhatsAppSettings(req, res, next) {
  try {
    const userId = req.user.id;
    const { metaPhoneNumberId, metaBusinessAccountId, metaAccessToken, storeId } = req.body;

    const cleanPhoneId = typeof metaPhoneNumberId === 'string' ? metaPhoneNumberId.trim() : undefined;
    const cleanBusinessId = typeof metaBusinessAccountId === 'string' ? metaBusinessAccountId.trim() : undefined;
    const cleanToken = typeof metaAccessToken === 'string' ? metaAccessToken.trim() : undefined;

    // Validate if token provided looks completely malformed
    if (cleanToken && cleanToken.length > 0 && cleanToken.length < 15 && !cleanToken.startsWith('mock_')) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid Meta Access Token format. Meta tokens typically start with "EAAG" or similar prefix.',
      });
    }

    // 1. If storeId specified, verify ownership
    let targetStore = null;
    if (storeId) {
      targetStore = await prisma.store.findFirst({
        where: { id: storeId, userId },
      });

      if (!targetStore) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'The specified store does not belong to your merchant account.',
        });
      }
    } else {
      // Find primary store if any
      targetStore = await prisma.store.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
    }

    // 2. Prepare update payloads
    const userUpdateData = {};
    if (cleanPhoneId !== undefined) userUpdateData.metaPhoneNumberId = cleanPhoneId || null;
    if (cleanBusinessId !== undefined) userUpdateData.metaBusinessAccountId = cleanBusinessId || null;
    if (cleanToken && cleanToken.length > 0) userUpdateData.metaAccessToken = cleanToken;

    const storeUpdateData = {};
    if (cleanPhoneId !== undefined) storeUpdateData.metaPhoneNumberId = cleanPhoneId || null;
    if (cleanBusinessId !== undefined) storeUpdateData.metaBusinessAccountId = cleanBusinessId || null;
    if (cleanToken && cleanToken.length > 0) storeUpdateData.metaAccessToken = cleanToken;

    // 3. Persist to database in transaction
    const [updatedUser, updatedStore] = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: userUpdateData,
      });

      let s = null;
      if (targetStore) {
        s = await tx.store.update({
          where: { id: targetStore.id },
          data: storeUpdateData,
        });
      }

      return [u, s];
    });

    const activeToken = updatedStore?.metaAccessToken || updatedUser.metaAccessToken;

    return res.status(200).json({
      success: true,
      message: 'WhatsApp Cloud API settings saved successfully.',
      settings: {
        metaPhoneNumberId: updatedStore?.metaPhoneNumberId || updatedUser.metaPhoneNumberId || '',
        metaBusinessAccountId: updatedStore?.metaBusinessAccountId || updatedUser.metaBusinessAccountId || '',
        hasMetaAccessToken: Boolean(activeToken),
        metaAccessTokenMasked: maskToken(activeToken),
        selectedStoreId: updatedStore?.id || null,
      },
    });
  } catch (error) {
    console.error('[updateWhatsAppSettings Error]', error);
    next(error);
  }
}

/**
 * Test WhatsApp Cloud API connection directly from the dashboard
 * POST /api/settings/whatsapp/test
 *
 * Body parameters:
 * - recipientPhone: string (e.g. "+919876543210")
 * - templateName: string (optional, defaults to "hello_world")
 */
export async function testWhatsAppConnection(req, res, next) {
  try {
    const userId = req.user.id;
    const { recipientPhone, templateName = 'hello_world', metaPhoneNumberId, metaAccessToken } = req.body;

    if (!recipientPhone) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Recipient phone number is required to send a test message.',
      });
    }

    const normalizedPhone = normalizePhoneNumber(recipientPhone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Could not parse "${recipientPhone}" into a valid international phone number (E.164).`,
      });
    }

    // Resolve merchant credentials: prioritize request payload if provided, then store/user DB, then system env
    const [user, primaryStore] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.store.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    ]);

    const activeToken =
      (metaAccessToken && typeof metaAccessToken === 'string' && metaAccessToken.trim().length > 0 ? metaAccessToken.trim() : null) ||
      primaryStore?.metaAccessToken ||
      user?.metaAccessToken ||
      (config.meta.accessToken.startsWith('mock_') ? null : config.meta.accessToken);

    const activePhoneId =
      (metaPhoneNumberId && typeof metaPhoneNumberId === 'string' && metaPhoneNumberId.trim().length > 0 ? metaPhoneNumberId.trim() : null) ||
      primaryStore?.metaPhoneNumberId ||
      user?.metaPhoneNumberId ||
      config.meta.phoneNumberId;

    if (!activeToken) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No Meta Access Token configured. Please enter and save your token before testing.',
      });
    }

    if (!activePhoneId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No Meta Phone Number ID configured. Please enter and save your Phone Number ID.',
      });
    }

    // Build components if testing order_confirmation
    let components = [];
    if (templateName === 'order_confirmation') {
      components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Merchant Dashboard Test' },
            { type: 'text', text: '#TEST-001' },
            { type: 'text', text: '$99.00' },
          ],
        },
      ];
    }

    // Wrap external Meta API call in dedicated try/catch
    // NEVER return HTTP 401 or 403 to prevent frontend JWT interceptor from invalidating merchant session
    let result;
    try {
      result = await sendMessage({
        customerPhone: normalizedPhone,
        templateName,
        components,
        storeAccessToken: activeToken,
        phoneNumberId: activePhoneId,
      });
    } catch (metaError) {
      console.warn('[testWhatsAppConnection Meta API failure]:', metaError.message);
      return res.status(400).json({
        success: false,
        error: 'MetaApiError',
        errorCode: metaError.errorCode,
        errorSubcode: metaError.errorSubcode,
        message: metaError.message || 'Meta API rejected test message.',
        details: metaError.details,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Test WhatsApp message sent successfully to +${normalizedPhone}!`,
      messageId: result.messageId,
      recipient: normalizedPhone,
    });
  } catch (error) {
    console.error('[testWhatsAppConnection Unexpected Error]', error);

    // Safeguard: Always return 400 Bad Request on unexpected test errors, never 401/403
    return res.status(400).json({
      success: false,
      error: 'TestConnectionError',
      message: error.message || 'An error occurred while dispatching test message.',
    });
  }
}

/**
 * Mask sensitive SMS credentials
 */
function maskSmsCredentials(provider, credentials) {
  if (!credentials || typeof credentials !== 'object') return null;
  if (provider === 'TWILIO') {
    const sid = credentials.accountSid || credentials.account_sid || '';
    const maskedSid = sid.length > 8 ? `${sid.slice(0, 4)}••••••••${sid.slice(-4)}` : '••••••••';
    return {
      accountSid: maskedSid,
      authToken: credentials.authToken || credentials.auth_token ? '••••••••' : '',
      fromNumber: credentials.fromNumber || credentials.from || '',
    };
  }
  if (provider === 'FAST2SMS') {
    const key = credentials.apiKey || credentials.api_key || '';
    const maskedKey = key.length > 8 ? `${key.slice(0, 4)}••••••••` : '••••••••';
    return {
      apiKey: maskedKey,
      senderId: credentials.senderId || credentials.sender_id || '',
    };
  }
  return {};
}

/**
 * Retrieve merchant SMS fallback settings for stores
 * GET /api/settings/sms
 */
export async function getSmsSettings(req, res, next) {
  try {
    const userId = req.user.id;

    const stores = await prisma.store.findMany({
      where: { userId },
      select: {
        id: true,
        storeUrl: true,
        platform: true,
        smsProvider: true,
        smsCredentials: true,
        smsSenderId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const primaryStore = stores[0] || null;

    const sanitizedStores = stores.map((s) => ({
      id: s.id,
      storeUrl: s.storeUrl,
      platform: s.platform,
      smsProvider: s.smsProvider || null,
      smsSenderId: s.smsSenderId || '',
      hasCredentials: Boolean(s.smsCredentials),
      credentialsMasked: maskSmsCredentials(s.smsProvider, s.smsCredentials),
    }));

    return res.status(200).json({
      success: true,
      settings: {
        smsProvider: primaryStore?.smsProvider || 'TWILIO',
        smsSenderId: primaryStore?.smsSenderId || '',
        hasCredentials: Boolean(primaryStore?.smsCredentials),
        credentialsMasked: maskSmsCredentials(primaryStore?.smsProvider, primaryStore?.smsCredentials),
        selectedStoreId: primaryStore?.id || null,
      },
      stores: sanitizedStores,
    });
  } catch (error) {
    console.error('[getSmsSettings Error]', error);
    next(error);
  }
}

/**
 * Update merchant store SMS fallback configuration
 * PUT /api/settings/sms
 */
export async function updateSmsSettings(req, res, next) {
  try {
    const userId = req.user.id;
    const { storeId, smsProvider, smsCredentials, smsSenderId } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'storeId is required to configure SMS fallback.',
      });
    }

    if (smsProvider && !['TWILIO', 'FAST2SMS'].includes(smsProvider)) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid SMS provider. Supported providers are TWILIO and FAST2SMS.',
      });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Store not found or does not belong to your account.',
      });
    }

    // Merge existing credentials if updating partially
    let finalCredentials = smsCredentials !== undefined ? smsCredentials : store.smsCredentials;
    if (smsCredentials && typeof smsCredentials === 'object' && store.smsCredentials) {
      const existing = typeof store.smsCredentials === 'object' ? store.smsCredentials : {};
      finalCredentials = { ...existing };
      for (const [key, val] of Object.entries(smsCredentials)) {
        // If merchant entered masked placeholder, preserve existing secret
        if (typeof val === 'string' && val.includes('••••')) {
          continue;
        }
        if (val) {
          finalCredentials[key] = val;
        }
      }
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        smsProvider: smsProvider !== undefined ? smsProvider : store.smsProvider,
        smsCredentials: finalCredentials,
        smsSenderId: smsSenderId !== undefined ? smsSenderId : store.smsSenderId,
      },
    });

    console.log(`[Settings] Updated SMS configuration for store ${updatedStore.storeUrl} (Provider: ${updatedStore.smsProvider})`);

    return res.status(200).json({
      success: true,
      message: 'SMS settings updated successfully.',
      store: {
        id: updatedStore.id,
        storeUrl: updatedStore.storeUrl,
        smsProvider: updatedStore.smsProvider,
        smsSenderId: updatedStore.smsSenderId,
        hasCredentials: Boolean(updatedStore.smsCredentials),
        credentialsMasked: maskSmsCredentials(updatedStore.smsProvider, updatedStore.smsCredentials),
      },
    });
  } catch (error) {
    console.error('[updateSmsSettings Error]', error);
    next(error);
  }
}

/**
 * Send a live test SMS message using merchant credentials
 * POST /api/settings/sms/test
 */
export async function testSmsConnection(req, res, next) {
  try {
    const userId = req.user.id;
    const { storeId, smsProvider, smsCredentials, smsSenderId, testPhone, testMessage } = req.body;

    if (!testPhone) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Recipient testPhone number is required.',
      });
    }

    let resolvedProvider = smsProvider;
    let resolvedCredentials = smsCredentials;
    let resolvedSenderId = smsSenderId;

    if (storeId) {
      const store = await prisma.store.findFirst({
        where: { id: storeId, userId },
      });
      if (store) {
        resolvedProvider = resolvedProvider || store.smsProvider;
        resolvedCredentials = resolvedCredentials || store.smsCredentials;
        resolvedSenderId = resolvedSenderId || store.smsSenderId;
      }
    }

    if (!resolvedProvider) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'No SMS provider specified or configured.',
      });
    }

    const result = await testSmsService({
      provider: resolvedProvider,
      credentials: resolvedCredentials || {},
      senderId: resolvedSenderId,
      testPhone,
      testMessage,
    });

    return res.status(200).json({
      success: true,
      message: `Test SMS dispatched successfully via ${resolvedProvider}!`,
      messageId: result.messageId,
      provider: result.provider,
      to: result.to,
    });
  } catch (error) {
    console.error('[testSmsConnection Error]', error);
    return res.status(400).json({
      success: false,
      error: 'TestConnectionError',
      message: error.message || 'Failed to dispatch test SMS.',
    });
  }
}

export default {
  getWhatsAppSettings,
  updateWhatsAppSettings,
  testWhatsAppConnection,
  getSmsSettings,
  updateSmsSettings,
  testSmsConnection,
};

