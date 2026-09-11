import crypto from 'node:crypto';
import prisma from '../db/prisma.js';
import { normalizeStoreUrl } from '../utils/url.js';

/**
 * Constant-time safe comparison of two base64 strings to prevent timing attacks.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Webhook Signature Verification Middleware
 *
 * Verifies authenticity of incoming Shopify and WooCommerce webhooks using
 * HMAC-SHA256 over the retained raw request body (req.rawBody).
 */
export async function verifyWebhookSignature(req, res, next) {
  try {
    const headers = req.headers || {};
    const payload = req.body || {};

    // 1. Extract Store Identifier from headers or body
    const storeId = headers['x-store-id'] || payload.storeId || payload.store_id;
    const rawStoreUrl =
      headers['x-shopify-shop-domain'] ||
      headers['x-wc-webhook-source'] ||
      headers['x-store-url'] ||
      payload.storeUrl ||
      payload.store_url ||
      payload.shop ||
      payload.domain;

    if (!storeId && !rawStoreUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing store identification',
        message:
          'Could not identify store. Provide store identifier via headers (x-shopify-shop-domain, x-wc-webhook-source, x-store-url, x-store-id) or payload.',
      });
    }

    // 2. Query Prisma Store model to fetch store record and its webhookSecret
    let store = null;

    if (storeId) {
      store = await prisma.store.findUnique({
        where: { id: String(storeId) },
      });
    }

    if (!store && rawStoreUrl) {
      const normalized = normalizeStoreUrl(rawStoreUrl);
      store = await prisma.store.findFirst({
        where: {
          OR: [
            { storeUrl: String(rawStoreUrl) },
            { storeUrl: normalized },
            { storeUrl: `https://${normalized}` },
            { storeUrl: `http://${normalized}` },
          ],
        },
      });
    }

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
        message: `No registered store found matching identifier: ${storeId || rawStoreUrl}`,
      });
    }

    // 3. Verify webhookSecret is configured on the store
    if (!store.webhookSecret) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Store exists but has no webhookSecret configured for HMAC verification.',
      });
    }

    // 4. Ensure rawBody is available for cryptographic hash computation
    const rawBodyBuffer = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));

    const shopifyHmac = headers['x-shopify-hmac-sha256'];
    const wooSignature = headers['x-wc-webhook-signature'];

    // 5. Shopify HMAC Logic
    if (shopifyHmac) {
      const calculatedHmac = crypto
        .createHmac('sha256', store.webhookSecret)
        .update(rawBodyBuffer)
        .digest('base64');

      if (!safeCompare(shopifyHmac, calculatedHmac)) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid Shopify webhook HMAC signature.',
        });
      }

      // Valid signature
      req.store = store;
      return next();
    }

    // 6. WooCommerce Signature Logic
    if (wooSignature) {
      const calculatedSignature = crypto
        .createHmac('sha256', store.webhookSecret)
        .update(rawBodyBuffer)
        .digest('base64');

      if (!safeCompare(wooSignature, calculatedSignature)) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid WooCommerce webhook signature.',
        });
      }

      // Valid signature
      req.store = store;
      return next();
    }

    // 7. If neither signature header is present, reject the unverified request
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message:
        'Missing required webhook signature header (x-shopify-hmac-sha256 or x-wc-webhook-signature).',
    });
  } catch (error) {
    console.error('[Webhook Signature Verification Error]', error);
    next(error);
  }
}

export default verifyWebhookSignature;
