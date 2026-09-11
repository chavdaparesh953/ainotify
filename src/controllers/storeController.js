import prisma from '../db/prisma.js';
import { normalizeStoreUrl } from '../utils/url.js';

const VALID_PLATFORMS = ['SHOPIFY', 'WOOCOMMERCE'];

/**
 * Connect / Onboard E-commerce Store
 * POST /api/stores/connect
 *
 * Payload:
 * {
 *   "userId": "uuid",
 *   "storeUrl": "https://my-store.myshopify.com",
 *   "platform": "SHOPIFY" | "WOOCOMMERCE",
 *   "accessToken": "shpat_xxx",
 *   "webhookSecret": "shpss_xxx"
 * }
 */
export async function connectStore(req, res, next) {
  try {
    const { userId, storeUrl, platform, accessToken, webhookSecret } = req.body || {};

    // 1. Validate Required Fields
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Missing or invalid field: userId is required.',
      });
    }

    if (!storeUrl || typeof storeUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Missing or invalid field: storeUrl is required.',
      });
    }

    const normalizedPlatform = platform ? String(platform).trim().toUpperCase() : '';
    if (!VALID_PLATFORMS.includes(normalizedPlatform)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Invalid platform "${platform}". Supported platforms are: ${VALID_PLATFORMS.join(', ')}`,
      });
    }

    if (!accessToken || typeof accessToken !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Missing or invalid field: accessToken is required for store API communication.',
      });
    }

    if (!webhookSecret || typeof webhookSecret !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Missing or invalid field: webhookSecret is required for cryptographic HMAC verification.',
      });
    }

    // 2. Normalize Store URL for consistent lookup
    const normalizedUrl = normalizeStoreUrl(storeUrl);
    if (!normalizedUrl) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid storeUrl provided.',
      });
    }

    // 3. Ensure User exists (or register placeholder user if not yet seeded)
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Create user record if not found (allows seamless onboarding during initial user creation)
      user = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@placeholder-merchant.io`,
          passwordHash: 'seeded_oauth_placeholder_hash',
          subscriptionStatus: 'TRIAL',
        },
      });
    }

    // 4. Upsert Store in Database
    const store = await prisma.store.upsert({
      where: { storeUrl: normalizedUrl },
      update: {
        userId: user.id,
        platform: normalizedPlatform,
        accessToken,
        webhookSecret,
      },
      create: {
        userId: user.id,
        platform: normalizedPlatform,
        storeUrl: normalizedUrl,
        accessToken,
        webhookSecret,
      },
    });

    // 5. Return sanitized response (avoid echoing sensitive tokens)
    return res.status(200).json({
      success: true,
      message: 'Store connected and configured successfully',
      store: {
        id: store.id,
        userId: store.userId,
        platform: store.platform,
        storeUrl: store.storeUrl,
        hasWebhookSecret: Boolean(store.webhookSecret),
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Store Controller Error]', error);
    next(error);
  }
}

export default {
  connectStore,
};
