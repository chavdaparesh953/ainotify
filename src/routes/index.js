import { Router } from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import storeRoutes from './storeRoutes.js';
import webhookRoutes from './webhookRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import billingRoutes from './billingRoutes.js';
import metaWebhookRoutes from './metaWebhookRoutes.js';
import automationRoutes from './automationRoutes.js';
import shopifyAuthRoutes from './shopifyAuthRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ecommerce-whatsapp-sms-saas',
    uptime: process.uptime(),
  });
});

// Mount Authentication API routes
router.use('/api/auth', authRoutes);

// Mount Merchant Dashboard API routes
router.use('/api/dashboard', dashboardRoutes);

// Mount Store Onboarding API routes
router.use('/api/stores', storeRoutes);

// Mount Shopify 1-Click OAuth routes
router.use('/api/shopify', shopifyAuthRoutes);

// Mount Inbound Meta WhatsApp Webhook routes
router.use('/api/webhooks/meta', metaWebhookRoutes);

// Mount Store E-commerce Webhook API routes
router.use('/api/webhooks', webhookRoutes);

// Mount Merchant Settings API routes
router.use('/api/settings', settingsRoutes);

// Mount Stripe Billing & Monetization API routes
router.use('/api/billing', billingRoutes);

// Mount Notification Automation Rules API routes
router.use('/api/automations', automationRoutes);

export default router;


