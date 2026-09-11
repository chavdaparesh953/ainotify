import { Router } from 'express';
import { connectStore } from '../controllers/storeController.js';

const router = Router();

/**
 * POST /api/stores/connect
 * Connects and registers a new Shopify or WooCommerce store with credentials
 */
router.post('/connect', connectStore);

export default router;
