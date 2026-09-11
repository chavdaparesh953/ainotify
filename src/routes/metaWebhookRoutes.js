import { Router } from 'express';
import { verifyMetaWebhook, handleMetaWebhook } from '../controllers/metaWebhookController.js';

const router = Router();

/**
 * GET /api/webhooks/meta
 * Meta Webhook verification challenge (hub.mode, hub.verify_token, hub.challenge)
 */
router.get('/', verifyMetaWebhook);

/**
 * POST /api/webhooks/meta
 * Receives incoming customer WhatsApp messages & Quick Reply / Interactive button clicks
 */
router.post('/', handleMetaWebhook);

export default router;
