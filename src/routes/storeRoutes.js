import { Router } from 'express';
import { connectStore, deleteStore } from '../controllers/storeController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * POST /api/stores/connect
 * Connects and registers a new Shopify or WooCommerce store with credentials
 */
router.post('/connect', connectStore);

/**
 * DELETE /api/stores/:id
 * Disconnects and deletes an existing connected store
 */
router.delete('/:id', authenticateToken, deleteStore);

export default router;
