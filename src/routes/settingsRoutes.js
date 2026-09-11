import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import {
  getWhatsAppSettings,
  updateWhatsAppSettings,
  testWhatsAppConnection,
  getSmsSettings,
  updateSmsSettings,
  testSmsConnection,
} from '../controllers/settingsController.js';

const router = Router();

// Protect all settings endpoints with merchant JWT authentication
router.use(authenticateToken);

/**
 * @route   GET /api/settings/whatsapp
 * @desc    Retrieve current merchant WhatsApp configuration & stores
 * @access  Private (Merchant JWT)
 */
router.get('/whatsapp', getWhatsAppSettings);

/**
 * @route   PUT /api/settings/whatsapp
 * @desc    Update merchant WhatsApp configuration
 * @access  Private (Merchant JWT)
 */
router.put('/whatsapp', updateWhatsAppSettings);

/**
 * @route   POST /api/settings/whatsapp/test
 * @desc    Send live test WhatsApp ping using merchant's configured credentials
 * @access  Private (Merchant JWT)
 */
router.post('/whatsapp/test', testWhatsAppConnection);

/**
 * @route   GET /api/settings/sms
 * @desc    Retrieve current merchant SMS fallback configuration & stores
 * @access  Private (Merchant JWT)
 */
router.get('/sms', getSmsSettings);

/**
 * @route   PUT /api/settings/sms
 * @desc    Update merchant store SMS fallback configuration
 * @access  Private (Merchant JWT)
 */
router.put('/sms', updateSmsSettings);

/**
 * @route   POST /api/settings/sms/test
 * @desc    Send live test SMS ping using merchant's configured credentials
 * @access  Private (Merchant JWT)
 */
router.post('/sms/test', testSmsConnection);

export default router;
