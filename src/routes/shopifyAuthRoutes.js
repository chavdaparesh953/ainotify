import { Router } from 'express';
import { initiateShopifyAuth, handleShopifyCallback } from '../controllers/shopifyAuthController.js';
import { authenticateOptionalToken } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * Shopify 1-Click OAuth Installation Routes
 */

// Step 1: Initiate OAuth handshake and redirect to Shopify
router.get('/auth', authenticateOptionalToken, initiateShopifyAuth);

// Step 2: Handle Shopify OAuth callback, exchange token, sync database, and register webhooks
router.get('/callback', handleShopifyCallback);

export default router;
