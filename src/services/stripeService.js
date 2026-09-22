import Stripe from 'stripe';
import config from '../config/env.js';
import prisma from '../db/prisma.js';

// Initialize Stripe Client
export const stripe = config.stripe.secretKey && !config.stripe.secretKey.startsWith('sk_test_mock_')
  ? new Stripe(config.stripe.secretKey, { apiVersion: '2024-12-18.acacia' })
  : null;

/**
 * Plan definitions and quota specifications
 */
export const PLANS = {
  FREE: {
    id: 'FREE',
    name: 'Starter Free',
    price: 0,
    interval: 'month',
    features: [
      '1 Connected Store (Shopify or WooCommerce)',
      '100 WhatsApp & SMS messages / month',
      'Standard Order Confirmation templates',
      'Community Support',
    ],
    quotas: {
      maxStores: 1,
      maxMessagesPerMonth: 100,
    },
  },
  BASIC: {
    id: 'BASIC',
    name: 'Growth Basic',
    price: 12,
    priceCents: 1200,
    interval: 'month',
    stripePriceId: config.stripe.priceBasic || null,
    features: [
      'Up to 3 Connected Stores',
      '5,000 WhatsApp & SMS messages / month',
      'Abandoned Cart & Order Confirmation triggers',
      'Standard BullMQ Queue Priority',
      'Email Support (24h turnaround)',
    ],
    quotas: {
      maxStores: 3,
      maxMessagesPerMonth: 5000,
    },
  },
  PRO: {
    id: 'PRO',
    name: 'Scale Pro',
    price: 35,
    priceCents: 3500,
    interval: 'month',
    stripePriceId: config.stripe.pricePro || null,
    features: [
      'Unlimited Connected Stores',
      '25,000 WhatsApp & SMS messages / month',
      'All automated triggers (Order, Shipping, Abandoned Cart)',
      'High-Priority BullMQ Queue Processing',
      'Custom Meta WhatsApp Templates',
      'Dedicated Account Support',
    ],
    quotas: {
      maxStores: 9999,
      maxMessagesPerMonth: 25000,
    },
  },
};

/**
 * Retrieves existing Stripe Customer ID or creates a new one in Stripe
 * @param {Object} user - Prisma User model
 * @returns {Promise<string>} Stripe customer ID
 */
export async function getOrCreateStripeCustomer(user) {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // If live Stripe is available, create customer
  if (stripe) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  // Fallback for mock/test development
  const mockCustomerId = `cus_mock_${user.id.slice(0, 8)}`;
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: mockCustomerId },
  });
  return mockCustomerId;
}

/**
 * Creates a Stripe Checkout Session for subscription
 * @param {Object} params
 * @param {Object} params.user - Authenticated Prisma user
 * @param {string} params.plan - 'BASIC' | 'PRO'
 * @param {string} [params.successUrl]
 * @param {string} [params.cancelUrl]
 * @returns {Promise<{ sessionId: string, url: string }>}
 */
export async function createCheckoutSession({ user, plan, successUrl, cancelUrl }) {
  const normalizedPlan = String(plan).toUpperCase();
  const planDetails = PLANS[normalizedPlan];

  if (!planDetails || normalizedPlan === 'FREE') {
    throw new Error(`Invalid plan specified: "${plan}". Choose either "BASIC" or "PRO".`);
  }

  const customerId = await getOrCreateStripeCustomer(user);

  const defaultSuccessUrl = `${config.appUrl}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=true`;
  const defaultCancelUrl = `${config.appUrl}/dashboard/billing?canceled=true`;

  const finalSuccessUrl = successUrl || defaultSuccessUrl;
  const finalCancelUrl = cancelUrl || defaultCancelUrl;

  // If live Stripe client is configured
  if (stripe) {
    // Build line items (use price ID if valid, otherwise inline dynamic price_data)
    let lineItem;
    if (planDetails.stripePriceId && !planDetails.stripePriceId.includes('price_your_') && !planDetails.stripePriceId.includes('price_basic_')) {
      lineItem = {
        price: planDetails.stripePriceId,
        quantity: 1,
      };
    } else {
      lineItem = {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `WaNotify ${planDetails.name}`,
            description: planDetails.features.slice(0, 2).join(' • '),
          },
          unit_amount: planDetails.priceCents,
          recurring: {
            interval: planDetails.interval,
          },
        },
        quantity: 1,
      };
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [lineItem],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        plan: normalizedPlan,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
      isMock: false,
    };
  }

  // Development / Mock fallback when Stripe credentials are placeholders
  const mockSessionId = `cs_test_mock_${Date.now()}`;
  const mockRedirectUrl = `${finalSuccessUrl.replace('{CHECKOUT_SESSION_ID}', mockSessionId)}&mock=true&plan=${normalizedPlan}`;

  return {
    sessionId: mockSessionId,
    url: mockRedirectUrl,
    isMock: true,
  };
}

/**
 * Creates a Stripe Customer Portal session for subscription management
 * @param {Object} params
 * @param {Object} params.user - Authenticated Prisma user
 * @param {string} [params.returnUrl]
 * @returns {Promise<{ url: string }>}
 */
export async function createCustomerPortalSession({ user, returnUrl }) {
  const defaultReturnUrl = `${config.appUrl}/dashboard/billing`;
  const finalReturnUrl = returnUrl || defaultReturnUrl;

  if (!user.stripeCustomerId) {
    throw new Error('No Stripe billing profile found for your account. Subscribe to a plan first.');
  }

  if (stripe) {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: finalReturnUrl,
    });

    return {
      url: portalSession.url,
      isMock: false,
    };
  }

  // Mock development fallback
  return {
    url: `${finalReturnUrl}?portal=mock_view`,
    isMock: true,
  };
}

/**
 * Cryptographically verifies and constructs Stripe Webhook Event
 * @param {Buffer|string} rawBody - Raw request body
 * @param {string} signature - stripe-signature header
 * @param {string} [webhookSecret] - Signing secret
 * @returns {Stripe.Event}
 */
export function constructWebhookEvent(rawBody, signature, webhookSecret = config.stripe.webhookSecret) {
  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET configuration.');
  }

  // If live Stripe SDK is initialized
  if (stripe) {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  // Mock / Unit test fallback: If rawBody is JSON string or Buffer, parse it
  try {
    const payloadStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
    const parsed = JSON.parse(payloadStr);

    if (parsed.type && parsed.data) {
      return parsed;
    }
    throw new Error('Invalid mock webhook payload format.');
  } catch (err) {
    throw new Error(`Stripe signature verification failed: ${err.message}`);
  }
}

export default {
  stripe,
  PLANS,
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createCustomerPortalSession,
  constructWebhookEvent,
};
