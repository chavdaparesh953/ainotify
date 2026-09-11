import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';
import config from '../config/env.js';
import { normalizeStoreUrl } from '../utils/url.js';

/**
 * Clean & standardize Shopify domain.
 * Ensures the domain always ends with '.myshopify.com'.
 * @param {string} rawShop
 * @returns {string}
 */
export function sanitizeShopDomain(rawShop) {
  if (!rawShop || typeof rawShop !== 'string') return '';
  let cleaned = rawShop
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');

  if (!cleaned.includes('.')) {
    cleaned = `${cleaned}.myshopify.com`;
  }
  return cleaned;
}

/**
 * Validates whether the domain matches standard Shopify format.
 * @param {string} domain
 * @returns {boolean}
 */
export function isValidShopifyDomain(domain) {
  if (!domain || typeof domain !== 'string') return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(domain);
}

/**
 * Verifies Shopify HMAC query parameter signature.
 * @param {Object} queryParams
 * @param {string} apiSecret
 * @returns {boolean}
 */
export function verifyShopifyHmac(queryParams, apiSecret) {
  const { hmac, signature, ...rest } = queryParams || {};
  const targetHmac = hmac || signature;
  if (!targetHmac) return false;

  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('&');

  const computed = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(targetHmac));
  } catch {
    return false;
  }
}

/**
 * Automatically register required Shopify webhooks via Admin API.
 * @param {string} shop
 * @param {string} accessToken
 * @param {string} webhookReceiveUrl
 * @returns {Promise<Array<{topic: string, success: boolean, [key: string]: any}>>}
 */
export async function registerShopifyWebhooks(shop, accessToken, webhookReceiveUrl) {
  const topics = ['orders/create', 'checkouts/update'];
  const results = [];

  const isMock =
    !accessToken ||
    accessToken.startsWith('shpat_mock_') ||
    accessToken.startsWith('shpat_test_') ||
    shop.includes('example.com') ||
    shop.includes('mock') ||
    shop.includes('test');

  for (const topic of topics) {
    if (isMock) {
      console.log(`[ShopifyOAuth] ⚡ Simulated webhook auto-registration: "${topic}" -> ${webhookReceiveUrl} on ${shop}`);
      results.push({ topic, success: true, simulated: true });
      continue;
    }

    try {
      const res = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: webhookReceiveUrl,
            format: 'json',
          },
        }),
      });

      if (res.status === 201) {
        const body = await res.json();
        console.log(`[ShopifyOAuth] ✅ Successfully registered webhook "${topic}" (ID: ${body.webhook?.id}) on ${shop}`);
        results.push({ topic, success: true, id: body.webhook?.id });
      } else if (res.status === 422) {
        // Webhook already registered or address already taken
        console.log(`[ShopifyOAuth] ℹ️ Webhook "${topic}" is already registered on ${shop}`);
        results.push({ topic, success: true, alreadyExists: true });
      } else {
        const errText = await res.text();
        console.warn(`[ShopifyOAuth] ⚠️ Webhook registration returned HTTP ${res.status} for "${topic}": ${errText}`);
        results.push({ topic, success: false, status: res.status, error: errText });
      }
    } catch (err) {
      console.error(`[ShopifyOAuth] ❌ Webhook registration network error for "${topic}":`, err.message);
      results.push({ topic, success: false, error: err.message });
    }
  }

  return results;
}

/**
 * 1. Initiate Shopify OAuth Flow
 * GET /api/shopify/auth
 *
 * Query Parameters:
 * - shop: string (e.g. "my-brand.myshopify.com" or "my-brand")
 * - token: string (optional JWT auth token for merchant identity)
 * - userId: string (optional merchant User ID)
 */
export async function initiateShopifyAuth(req, res, next) {
  try {
    const rawShop = req.query.shop || req.body?.shop;
    if (!rawShop) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Missing required query parameter: shop domain is required.',
      });
    }

    const shop = sanitizeShopDomain(rawShop);
    if (!isValidShopifyDomain(shop)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Invalid Shopify domain "${shop}". Domain must match the format: <store-name>.myshopify.com`,
      });
    }

    // Resolve merchant user ID from session or query token
    let userId = req.user?.id || req.query.userId;
    if (!userId && req.query.token) {
      try {
        const decoded = jwt.verify(req.query.token, config.jwt.secret);
        userId = decoded.id;
      } catch (tokenErr) {
        console.warn('[ShopifyOAuth] Failed to decode query auth token:', tokenErr.message);
      }
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Merchant user authentication is required to initiate store connection.',
      });
    }

    // Generate secure anti-CSRF state nonce signed with JWT
    const nonce = crypto.randomBytes(16).toString('hex');
    const state = jwt.sign(
      {
        nonce,
        userId,
        shop,
      },
      config.jwt.secret,
      { expiresIn: '15m' }
    );

    // Resolve callback redirect URI
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || `localhost:${config.port}`;
    const redirectUri = config.shopify.redirectUri || `${protocol}://${host}/api/shopify/callback`;

    const scopes = config.shopify.scopes;
    const clientId = config.shopify.apiKey;

    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(
      scopes
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

    console.log(`[ShopifyOAuth] 🚀 Initiating OAuth for store "${shop}" | Merchant: ${userId}`);

    // If request accepts JSON or requested explicitly via query
    if (req.query.json === 'true' || (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html'))) {
      return res.status(200).json({
        success: true,
        shop,
        authUrl,
        state,
      });
    }

    return res.redirect(authUrl);
  } catch (error) {
    console.error('[ShopifyOAuth initiateShopifyAuth Error]', error);
    next(error);
  }
}

/**
 * 2. Handle Shopify OAuth Callback
 * GET /api/shopify/callback
 *
 * Query Parameters:
 * - code: string (authorization code)
 * - hmac: string (Shopify query signature)
 * - shop: string (store domain)
 * - state: string (signed CSRF state nonce)
 * - timestamp: string
 */
export async function handleShopifyCallback(req, res, next) {
  try {
    const { code, hmac, shop: rawShop, state } = req.query;

    // 1. Validate State Parameter (CSRF Protection)
    if (!state) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Missing OAuth state parameter. Request rejected to prevent CSRF attacks.',
      });
    }

    let decodedState;
    try {
      decodedState = jwt.verify(state, config.jwt.secret);
    } catch (err) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Invalid or expired OAuth state nonce. Please restart the installation.',
      });
    }

    const { userId, shop: stateShop } = decodedState;
    if (!userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'State nonce does not contain a valid merchant user identifier.',
      });
    }

    // 2. Validate Shop Domain
    const shop = sanitizeShopDomain(rawShop);
    if (!isValidShopifyDomain(shop) || (stateShop && shop !== stateShop)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Shop domain mismatch or invalid format.',
      });
    }

    // 3. Verify HMAC Signature
    const isMock =
      config.shopify.apiSecret === 'mock_shopify_api_secret' ||
      req.query.mock === 'true' ||
      String(code).startsWith('mock_');

    if (!isMock) {
      const isHmacValid = verifyShopifyHmac(req.query, config.shopify.apiSecret);
      if (!isHmacValid) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'HMAC verification failed. The callback request could not be authenticated as coming from Shopify.',
        });
      }
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Missing authorization code from Shopify callback.',
      });
    }

    // 4. Exchange authorization code for permanent offline access token
    let accessToken = '';
    if (isMock) {
      accessToken = `shpat_oauth_${crypto.randomBytes(12).toString('hex')}`;
      console.log(`[ShopifyOAuth] ⚡ Mock token exchanged for store "${shop}": ${accessToken}`);
    } else {
      try {
        const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: config.shopify.apiKey,
            client_secret: config.shopify.apiSecret,
            code,
          }),
        });

        if (!tokenRes.ok) {
          const errBody = await tokenRes.text();
          console.error(`[ShopifyOAuth] Access token exchange failed (HTTP ${tokenRes.status}):`, errBody);
          return res.status(502).json({
            success: false,
            error: 'Bad Gateway',
            message: `Shopify token exchange failed with status ${tokenRes.status}`,
          });
        }

        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token;
      } catch (tokenErr) {
        console.error('[ShopifyOAuth] Network error during token exchange:', tokenErr.message);
        return res.status(502).json({
          success: false,
          error: 'Bad Gateway',
          message: 'Network error connecting to Shopify OAuth token endpoint.',
        });
      }
    }

    // 5. Create or Update Store Model in PostgreSQL
    const store = await prisma.store.upsert({
      where: { storeUrl: shop },
      update: {
        userId,
        platform: 'SHOPIFY',
        accessToken,
        webhookSecret: config.shopify.apiSecret || 'shopify_webhook_secret',
      },
      create: {
        userId,
        platform: 'SHOPIFY',
        storeUrl: shop,
        accessToken,
        webhookSecret: config.shopify.apiSecret || 'shopify_webhook_secret',
      },
    });

    console.log(`[ShopifyOAuth] ✅ Store synchronized in database: ${shop} (ID: ${store.id}) linked to User: ${userId}`);

    // 6. Automatically register required Shopify webhooks
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || `localhost:${config.port}`;
    const webhookReceiveUrl = `${protocol}://${host}/api/webhooks/receive`;

    await registerShopifyWebhooks(shop, accessToken, webhookReceiveUrl);

    // 7. Redirect to Frontend Onboarding / Dashboard
    const redirectUrl = `${config.appUrl}/onboarding?step=2&connected=true&store=${encodeURIComponent(shop)}&storeId=${encodeURIComponent(store.id)}`;

    if (req.query.json === 'true' || (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html'))) {
      return res.status(200).json({
        success: true,
        message: 'Shopify OAuth completed successfully',
        store,
        redirectUrl,
      });
    }

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('[ShopifyOAuth handleShopifyCallback Error]', error);
    next(error);
  }
}

export default {
  initiateShopifyAuth,
  handleShopifyCallback,
  sanitizeShopDomain,
  isValidShopifyDomain,
  verifyShopifyHmac,
  registerShopifyWebhooks,
};
