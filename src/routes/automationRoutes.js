import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import {
  getStoreRules,
  updateStoreRule,
  batchUpdateStoreRules,
} from '../controllers/automationController.js';

const router = Router();

// Protect all automation endpoints with merchant JWT authentication
router.use(authenticateToken);

/**
 * @route   GET /api/automations/:storeId
 * @desc    Fetch all notification rules for a store
 * @access  Private (Merchant JWT)
 */
router.get('/:storeId', getStoreRules);

/**
 * @route   PUT /api/automations/:storeId/rule
 * @desc    Upsert a single notification rule for a store
 * @access  Private (Merchant JWT)
 */
router.put('/:storeId/rule', updateStoreRule);

/**
 * @route   PUT /api/automations/:storeId/batch
 * @desc    Batch upsert multiple notification rules for a store
 * @access  Private (Merchant JWT)
 */
router.put('/:storeId/batch', batchUpdateStoreRules);

export default router;
