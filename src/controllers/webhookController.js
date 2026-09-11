import prisma from '../db/prisma.js';
import { enqueueWebhookJob } from '../queues/webhookQueue.js';
import { normalizeStoreUrl } from '../utils/url.js';

/**
 * Webhook Ingestion Controller
 * POST /api/webhooks/receive
 *
 * Responsibilities:
 * 1. Fast ingestion (<50ms) to satisfy Shopify/WooCommerce timeout thresholds.
 * 2. Multi-channel store identification via standard headers and JSON payload fields.
 * 3. Validation against Prisma Store registry (or leverages pre-validated req.store).
 * 4. Asynchronous handoff to BullMQ Redis Queue.
 */
export async function receiveWebhook(req, res, next) {
  const startTime = Date.now();

  try {
    const payload = req.body || {};
    const headers = req.headers || {};

    // 1. Check if store was already validated and attached by verifyWebhookSignature
    let store = req.store || null;

    if (!store) {
      // Fallback manual store extraction if middleware was bypassed
      const storeIdHeader = headers['x-store-id'];
      const storeUrlHeader =
        headers['x-store-url'] ||
        headers['x-shopify-shop-domain'] ||
        headers['x-wc-webhook-source'];

      const storeIdBody = payload.storeId || payload.store_id;
      const storeUrlBody = payload.storeUrl || payload.store_url || payload.shop || payload.domain;

      const targetStoreId = storeIdHeader || storeIdBody;
      const rawStoreUrl = storeUrlHeader || storeUrlBody;

      if (!targetStoreId && !rawStoreUrl) {
        return res.status(400).json({
          success: false,
          error: 'Missing store identification',
          message:
            'Could not identify store. Provide store identifier via header (x-store-id, x-shopify-shop-domain, x-wc-webhook-source, x-store-url) or body (storeId, storeUrl, shop).',
        });
      }

      if (targetStoreId) {
        store = await prisma.store.findUnique({
          where: { id: String(targetStoreId) },
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
    }

    // If store is not registered in the SaaS
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
        message: `No active store found matching the provided identifier: ${targetStoreId || rawStoreUrl}`,
      });
    }

    // 3. Extract webhook topic if provided (Shopify / WooCommerce / Custom)
    const topic =
      headers['x-shopify-topic'] ||
      headers['x-wc-webhook-topic'] ||
      payload.topic ||
      payload.event ||
      'webhook.received';

    // 4. Determine if this is an abandoned checkout event requiring delayed processing
    const normalizedTopic = String(topic).toLowerCase();
    const isCheckoutTopic =
      normalizedTopic === 'checkouts/create' ||
      normalizedTopic === 'checkouts/update' ||
      normalizedTopic === 'cart/abandoned' ||
      normalizedTopic.includes('checkout') ||
      normalizedTopic.includes('abandon');

    const jobOptions = {};
    let isDelayed = false;
    let delayMs = 0;

    if (isCheckoutTopic) {
      // Default: 30 minutes (30 * 60 * 1000 = 1,800,000 ms)
      const DEFAULT_CHECKOUT_DELAY_MS = 30 * 60 * 1000;
      const customDelay =
        payload._testDelayMs !== undefined
          ? Number(payload._testDelayMs)
          : headers['x-test-delay-ms']
          ? Number(headers['x-test-delay-ms'])
          : DEFAULT_CHECKOUT_DELAY_MS;

      jobOptions.delay = Math.max(0, customDelay);
      isDelayed = jobOptions.delay > 0;
      delayMs = jobOptions.delay;
    }

    // 5. Dispatch raw payload to BullMQ Redis Queue
    const job = await enqueueWebhookJob({
      storeId: store.id,
      storeUrl: store.storeUrl,
      platform: store.platform,
      topic,
      payload,
      headers: {
        'x-shopify-topic': headers['x-shopify-topic'],
        'x-shopify-shop-domain': headers['x-shopify-shop-domain'],
        'x-shopify-hmac-sha256': headers['x-shopify-hmac-sha256'],
        'x-wc-webhook-topic': headers['x-wc-webhook-topic'],
        'x-wc-webhook-source': headers['x-wc-webhook-source'],
        'x-wc-webhook-signature': headers['x-wc-webhook-signature'],
        'content-type': headers['content-type'],
      },
      options: jobOptions,
    });

    const duration = Date.now() - startTime;

    // 6. Return fast 200 OK response to prevent timeouts
    return res.status(200).json({
      success: true,
      message: isDelayed
        ? `Webhook received and queued with ${delayMs / 60000}m delay for abandoned checkout sequence`
        : 'Webhook received and queued for background processing',
      jobId: job.id,
      storeId: store.id,
      platform: store.platform,
      topic,
      isDelayed,
      delayMs,
      ingestTimeMs: duration,
    });
  } catch (error) {
    console.error('[Webhook Controller Error]', error);
    next(error);
  }
}

export default {
  receiveWebhook,
};
