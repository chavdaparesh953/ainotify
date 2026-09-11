import { Router } from 'express';
import { receiveWebhook } from '../controllers/webhookController.js';
import { verifyWebhookSignature } from '../middlewares/verifyWebhookSignature.js';

const router = Router();

/**
 * POST /api/webhooks/receive
 * Ingests Shopify and WooCommerce webhooks into background queue with HMAC verification
 */
router.post('/receive', verifyWebhookSignature, receiveWebhook);

export default router;
