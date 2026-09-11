import { Router } from 'express';
import { getStats, getRecentLogs, getStores } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Protect all dashboard routes with JWT authentication
router.use(authenticateToken);

/**
 * GET /api/dashboard/stats
 * Aggregate messaging counts (SENT, FAILED, PENDING, READ) and delivery rate
 */
router.get('/stats', getStats);

/**
 * GET /api/dashboard/recent-logs
 * Paginated list of recent message logs for merchant's stores
 */
router.get('/recent-logs', getRecentLogs);

/**
 * GET /api/dashboard/stores
 * List all connected stores for merchant (excluding secrets)
 */
router.get('/stores', getStores);

export default router;
