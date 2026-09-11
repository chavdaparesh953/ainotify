import config from '../config/env.js';

/**
 * Custom Error class for WhatsApp Meta Cloud API errors
 */
export class WhatsAppApiError extends Error {
  constructor(message, { statusCode, errorCode, errorSubcode, details, isRateLimit = false, isInvalidNumber = false }) {
    super(message);
    this.name = 'WhatsAppApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errorSubcode = errorSubcode;
    this.details = details;
    this.isRateLimit = isRateLimit;
    this.isInvalidNumber = isInvalidNumber;
  }
}

/**
 * Meta WhatsApp Cloud API Service
 * Dispatches template-based WhatsApp messages to customers.
 *
 * @param {string|Object} customerPhoneOrOptions - Recipient phone number or options object
 * @param {string} [templateName] - Registered WhatsApp template name
 * @param {Array} [components] - Template components array
 * @param {string} [storeAccessToken] - Store-specific or system WhatsApp access token
 * @param {Object} [options] - Additional parameters (phoneNumberId, languageCode, timeoutMs)
 * @returns {Promise<Object>} API response including messageId
 */
export async function sendMessage(
  customerPhoneOrOptions,
  templateName,
  components = [],
  storeAccessToken,
  options = {}
) {
  // Support both positional arguments and single object argument
  let phone;
  let template;
  let comps;
  let token;
  let opts;

  if (typeof customerPhoneOrOptions === 'object' && customerPhoneOrOptions !== null) {
    phone = customerPhoneOrOptions.customerPhone;
    template = customerPhoneOrOptions.templateName;
    comps = customerPhoneOrOptions.components || [];
    token = customerPhoneOrOptions.storeAccessToken;
    opts = customerPhoneOrOptions;
  } else {
    phone = customerPhoneOrOptions;
    template = templateName;
    comps = components || [];
    token = storeAccessToken;
    opts = options || {};
  }

  // Resolve credentials with fallback to system .env Meta credentials
  const systemAccessToken = config.meta.accessToken;
  const phoneNumberId = opts.phoneNumberId || config.meta.phoneNumberId;
  const apiVersion = opts.apiVersion || config.meta.apiVersion || 'v17.0';
  const languageCode = opts.languageCode || 'en_US';
  const timeoutMs = opts.timeoutMs || 10000;

  let primaryToken = token || systemAccessToken;

  // If token is a Shopify/WooCommerce store secret rather than a Meta Graph API token,
  // fall back immediately to system META_ACCESS_TOKEN if configured
  const isEcommerceStoreToken =
    typeof primaryToken === 'string' &&
    (primaryToken.startsWith('shpat_') || primaryToken.startsWith('shpca_'));

  if (isEcommerceStoreToken && systemAccessToken && systemAccessToken !== primaryToken) {
    console.warn(
      `[WhatsAppService] storeAccessToken appears to be a store platform token. Falling back to system META_ACCESS_TOKEN for alpha testing.`
    );
    primaryToken = systemAccessToken;
  }

  if (!phone) {
    throw new WhatsAppApiError('Customer phone number is required.', {
      statusCode: 400,
      isInvalidNumber: true,
    });
  }

  if (!template) {
    throw new WhatsAppApiError('Template name is required for WhatsApp template message.', {
      statusCode: 400,
    });
  }

  if (!primaryToken) {
    throw new WhatsAppApiError(
      'Missing WhatsApp Access Token. Provide storeAccessToken or configure META_ACCESS_TOKEN in .env.',
      { statusCode: 401 }
    );
  }

  if (!phoneNumberId) {
    throw new WhatsAppApiError(
      'Missing WhatsApp Phone Number ID. Provide phoneNumberId or configure META_PHONE_NUMBER_ID.',
      { statusCode: 400 }
    );
  }

  const endpointUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const requestBody = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: String(phone).replace(/\D/g, ''), // Ensure digits only for Meta API
    type: 'template',
    template: {
      name: template,
      language: {
        code: languageCode,
      },
      components: Array.isArray(comps) ? comps : [],
    },
  };

  /**
   * Helper to dispatch the HTTP request to Meta Graph API
   */
  async function dispatchRequest(authToken) {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutTimer));

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorObj = data.error || {};
        const errorCode = errorObj.code;
        const errorSubcode = errorObj.error_subcode;
        const errorMessage = errorObj.message || `Meta Graph API responded with status ${response.status}`;

        // Identify specific Meta error classes
        const isRateLimit =
          response.status === 429 ||
          errorCode === 4 ||
          errorCode === 80007 ||
          errorCode === 130429 ||
          errorObj.type === 'OAuthRateLimitException';

        // Codes for invalid phone numbers / undeliverable recipients
        const isInvalidNumber =
          errorCode === 131026 || // Message undeliverable
          errorCode === 131042 || // Business eligibility or user outside allowed window
          errorCode === 131047 || // More than 24 hours elapsed without template
          errorCode === 100;      // Invalid parameter

        throw new WhatsAppApiError(errorMessage, {
          statusCode: response.status,
          errorCode,
          errorSubcode,
          details: errorObj.error_data || errorObj,
          isRateLimit,
          isInvalidNumber,
        });
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new WhatsAppApiError(`Meta API request timed out after ${timeoutMs}ms`, {
          statusCode: 504,
        });
      }
      throw error;
    }
  }

  // Attempt dispatch with primary token, falling back to system token if rejected
  let responseData;
  try {
    responseData = await dispatchRequest(primaryToken);
  } catch (error) {
    const isAuthError =
      error instanceof WhatsAppApiError &&
      (error.statusCode === 401 ||
        error.errorCode === 190 ||
        String(error.message).toLowerCase().includes('oauth') ||
        String(error.message).toLowerCase().includes('access token'));

    // If store token was rejected and systemAccessToken is available, retry with system token
    if (isAuthError && systemAccessToken && primaryToken !== systemAccessToken) {
      console.warn(
        `[WhatsAppService] Merchant storeAccessToken failed (${error.message}). Retrying with system META_ACCESS_TOKEN fallback...`
      );
      try {
        responseData = await dispatchRequest(systemAccessToken);
      } catch (fallbackError) {
        if (fallbackError instanceof WhatsAppApiError) {
          throw fallbackError;
        }
        throw new WhatsAppApiError(
          `Network or connection error communicating with Meta API: ${fallbackError.message}`,
          { statusCode: 500 }
        );
      }
    } else {
      if (error instanceof WhatsAppApiError) {
        throw error;
      }
      throw new WhatsAppApiError(`Network or connection error communicating with Meta API: ${error.message}`, {
        statusCode: 500,
      });
    }
  }

  const messageId = responseData.messages?.[0]?.id || null;

  return {
    success: true,
    messageId,
    recipient: phone,
    rawResponse: responseData,
  };
}

/**
 * Sends a Meta WhatsApp Interactive Message with Quick Reply action buttons.
 *
 * @param {string} recipientPhone - Customer E.164 phone number
 * @param {Object} interactiveConfig - Header, Body, Footer, and Buttons array
 * @param {string} [storeAccessToken] - Merchant or system token
 * @param {Object} [options] - Additional options (phoneNumberId, etc.)
 * @returns {Promise<Object>} API response including messageId
 */
export async function sendInteractiveButtonMessage(
  recipientPhone,
  interactiveConfig = {},
  storeAccessToken,
  options = {}
) {
  const phone = recipientPhone;
  const { headerText, bodyText, footerText, buttons = [] } = interactiveConfig;
  const systemAccessToken = config.meta.accessToken;
  const phoneNumberId = options.phoneNumberId || config.meta.phoneNumberId;
  const apiVersion = options.apiVersion || config.meta.apiVersion || 'v17.0';
  const timeoutMs = options.timeoutMs || 10000;

  let primaryToken = storeAccessToken || systemAccessToken;

  const isEcommerceStoreToken =
    typeof primaryToken === 'string' &&
    (primaryToken.startsWith('shpat_') || primaryToken.startsWith('shpca_'));

  if (isEcommerceStoreToken && systemAccessToken && systemAccessToken !== primaryToken) {
    primaryToken = systemAccessToken;
  }

  if (!phone) {
    throw new WhatsAppApiError('Customer phone number is required.', { statusCode: 400, isInvalidNumber: true });
  }

  if (!bodyText) {
    throw new WhatsAppApiError('Body text is required for interactive message.', { statusCode: 400 });
  }

  if (!primaryToken) {
    throw new WhatsAppApiError('Missing WhatsApp Access Token.', { statusCode: 401 });
  }

  if (!phoneNumberId) {
    throw new WhatsAppApiError('Missing WhatsApp Phone Number ID.', { statusCode: 400 });
  }

  const endpointUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const requestBody = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: String(phone).replace(/\D/g, ''),
    type: 'interactive',
    interactive: {
      type: 'button',
      header: headerText ? { type: 'text', text: headerText } : undefined,
      body: { text: bodyText },
      footer: footerText ? { text: footerText } : undefined,
      action: {
        buttons: buttons.map((b) => ({
          type: 'reply',
          reply: {
            id: b.id,
            title: String(b.title).slice(0, 20),
          },
        })),
      },
    },
  };

  async function dispatch(authToken) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorObj = data.error || {};
        throw new WhatsAppApiError(errorObj.message || `Meta API Error ${response.status}`, {
          statusCode: response.status,
          errorCode: errorObj.code,
          errorSubcode: errorObj.error_subcode,
          details: errorObj,
        });
      }

      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new WhatsAppApiError(`Interactive message timed out after ${timeoutMs}ms`, { statusCode: 504 });
      }
      throw err;
    }
  }

  let responseData;
  try {
    responseData = await dispatch(primaryToken);
  } catch (error) {
    if (systemAccessToken && primaryToken !== systemAccessToken) {
      try {
        responseData = await dispatch(systemAccessToken);
      } catch (fallbackError) {
        throw fallbackError instanceof WhatsAppApiError
          ? fallbackError
          : new WhatsAppApiError(fallbackError.message, { statusCode: 500 });
      }
    } else {
      throw error instanceof WhatsAppApiError ? error : new WhatsAppApiError(error.message, { statusCode: 500 });
    }
  }

  const messageId = responseData.messages?.[0]?.id || null;

  return {
    success: true,
    messageId,
    recipient: phone,
    rawResponse: responseData,
  };
}

export default {
  sendMessage,
  sendInteractiveButtonMessage,
  WhatsAppApiError,
};

