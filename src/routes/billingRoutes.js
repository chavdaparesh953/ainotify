import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import {
  getCurrentPlan,
  createCheckoutSession,
  createCustomerPortalSession,
  handleStripeWebhook,
} from '../controllers/billingController.js';

const router = Router();

/**
 * @route   POST /api/billing/webhook
 * @desc    Public Stripe Webhook Receiver (verifies rawBody signature)
 * @access  Public
 */
router.post('/webhook', handleStripeWebhook);

/**
 * @route   GET /api/billing/current-plan
 * @desc    Retrieve active merchant subscription tier, status, and quotas
 * @access  Private (Merchant JWT)
 */
router.get('/current-plan', authenticateToken, getCurrentPlan);

/**
 * @route   POST /api/billing/create-checkout-session
 * @desc    Initialize Stripe Checkout Session for plan upgrade
 * @access  Private (Merchant JWT)
 */
router.post('/create-checkout-session', authenticateToken, createCheckoutSession);

/**
 * @route   POST /api/billing/customer-portal
 * @desc    Initialize Stripe Customer Billing Portal session
 * @access  Private (Merchant JWT)
 */
router.post('/customer-portal', authenticateToken, createCustomerPortalSession);

export default router;
