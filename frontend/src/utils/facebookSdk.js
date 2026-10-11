/**
 * Meta Facebook JavaScript SDK & WhatsApp Embedded Signup Helper
 * Provides seamless 1-Click WhatsApp Onboarding for Merchants.
 */

let sdkPromise = null;

/**
 * Dynamically loads and initializes the Facebook JavaScript SDK
 * @param {string} appId - Meta App ID
 * @returns {Promise<any>} Resolves with window.FB
 */
export function loadFacebookSdk(appId) {
  if (window.FB) {
    if (appId && window.FB.init) {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version: 'v18.0',
      });
    }
    return Promise.resolve(window.FB);
  }

  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = function () {
      try {
        window.FB.init({
          appId: appId || '',
          cookie: true,
          xfbml: true,
          version: 'v18.0',
        });
        resolve(window.FB);
      } catch (err) {
        reject(err);
      }
    };

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';

    script.onerror = () => {
      reject(new Error('Failed to load Facebook SDK. Please check your internet connection or ad blocker.'));
    };

    document.head.appendChild(script);
  });

  return sdkPromise;
}

/**
 * Launch Meta's 1-Click WhatsApp Embedded Signup Popup
 *
 * @param {Object} options
 * @param {string} options.appId - Meta App ID
 * @param {string} [options.configId] - Meta Login Configuration ID with WhatsApp permissions
 * @returns {Promise<{ code?: string, accessToken?: string, wabaId?: string, phoneNumberId?: string }>}
 */
export async function launchWhatsAppSignup({ appId, configId }) {
  if (!appId) {
    throw new Error(
      'Meta App ID is not configured. Please add META_APP_ID and META_APP_SECRET in the SaaS backend .env file.'
    );
  }

  const FB = await loadFacebookSdk(appId);

  return new Promise((resolve, reject) => {
    let sessionData = null;

    // Listen to official Meta Embedded Signup message events
    const messageListener = (event) => {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        return;
      }

      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (payload?.type === 'WA_EMBEDDED_SIGNUP') {
          if (payload.event === 'FINISH') {
            sessionData = payload.data || {};
          }
        }
      } catch {
        // Ignore unrelated postMessage packets
      }
    };

    window.addEventListener('message', messageListener);

    const loginOptions = {
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        feature: 'whatsapp_embedded_signup',
        version: 2,
        sessionInfoVersion: 2,
      },
    };

    if (configId) {
      loginOptions.config_id = configId;
    } else {
      loginOptions.scope = 'whatsapp_business_management,whatsapp_business_messaging';
    }

    FB.login((response) => {
      window.removeEventListener('message', messageListener);

      if (response?.authResponse) {
        const auth = response.authResponse;
        resolve({
          code: auth.code || null,
          accessToken: auth.accessToken || null,
          wabaId: sessionData?.waba_id || null,
          phoneNumberId: sessionData?.phone_number_id || null,
        });
      } else {
        const errorMsg =
          response?.status === 'not_authorized'
            ? 'WhatsApp onboarding cancelled by merchant.'
            : 'Meta WhatsApp connection was cancelled or closed.';
        reject(new Error(errorMsg));
      }
    }, loginOptions);
  });
}
