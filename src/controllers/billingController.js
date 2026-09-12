import prisma from '../db/prisma.js';
import stripeService, { PLANS } from '../services/stripeService.js';
import config from '../config/env.js';

/**
 * Retrieve current merchant subscription plan, status, and quotas
 * GET /api/billing/current-plan
 */
export async function getCurrentPlan(req, res, next) {
  try {
    const userId = req.user.id;

    const [user, storeCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          plan: true,
          subscriptionStatus: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          createdAt: true,
        },
      }),
      prisma.store.count({
        where: { userId },
      }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant record not found.',
      });
    }

    // Message count during current calendar month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const messagesThisMonth = await prisma.messageLog.count({
      where: {
        store: { userId },
        createdAt: { gte: startOfMonth },
      },
    });

    const activePlan = user.plan || 'FREE';
    const activePlanDetails = PLANS[activePlan] || PLANS.FREE;

    return res.status(200).json({
      success: true,
      subscription: {
        plan: activePlan,
        status: user.subscriptionStatus,
        hasActiveSubscription: Boolean(user.stripeSubscriptionId && user.subscriptionStatus === 'ACTIVE'),
        stripeCustomerId: user.stripeCustomerId,
        isTrial: user.subscriptionStatus === 'TRIAL',
        planDetails: activePlanDetails,
        usage: {
          connectedStores: storeCount,
          maxStores: activePlanDetails.quotas.maxStores,
          messagesThisMonth,
          maxMessagesPerMonth: activePlanDetails.quotas.maxMessagesPerMonth,
          storeQuotaPercent: Math.min(100, Math.round((storeCount / activePlanDetails.quotas.maxStores) * 100)),
          messageQuotaPercent: Math.min(100, Math.round((messagesThisMonth / activePlanDetails.quotas.maxMessagesPerMonth) * 100)),
        },
      },
      availablePlans: PLANS,
    });
  } catch (error) {
    console.error('[getCurrentPlan Error]', error);
    next(error);
  }
}

/**
 * Create a Stripe Checkout Session for subscription upgrade
 * POST /api/billing/create-checkout-session
 *
 * Body parameters:
 * - plan: 'BASIC' | 'PRO'
 */
export async function createCheckoutSession(req, res, next) {
  try {
    const userId = req.user.id;
    const { plan, successUrl, cancelUrl } = req.body;

    if (!plan) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Subscription plan ("BASIC" or "PRO") is required.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant user not found.',
      });
    }

    // Resolve origin dynamically from headers (Vercel, custom domain, or local dev) with config.appUrl fallback
    let clientOrigin = config.appUrl;
    if (req.headers.origin) {
      clientOrigin = req.headers.origin;
    } else if (req.headers.referer) {
      try {
        clientOrigin = new URL(req.headers.referer).origin;
      } catch (_) {}
    }

    const resolvedSuccessUrl = successUrl || `${clientOrigin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=true`;
    const resolvedCancelUrl = cancelUrl || `${clientOrigin}/dashboard/billing?canceled=true`;

    const session = await stripeService.createCheckoutSession({
      user,
      plan,
      successUrl: resolvedSuccessUrl,
      cancelUrl: resolvedCancelUrl,
    });

    return res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.sessionId,
      isMock: session.isMock,
    });
  } catch (error) {
    console.error('[createCheckoutSession Error]', error);
    return res.status(400).json({
      success: false,
      error: 'BillingError',
      message: error.message || 'Failed to initialize Stripe Checkout Session.',
    });
  }
}

/**
 * Create a Stripe Customer Portal session for billing self-service
 * POST /api/billing/customer-portal
 */
export async function createCustomerPortalSession(req, res, next) {
  try {
    const userId = req.user.id;
    const { returnUrl } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant user not found.',
      });
    }

    // Resolve origin dynamically from headers with config.appUrl fallback
    let clientOrigin = config.appUrl;
    if (req.headers.origin) {
      clientOrigin = req.headers.origin;
    } else if (req.headers.referer) {
      try {
        clientOrigin = new URL(req.headers.referer).origin;
      } catch (_) {}
    }

    const resolvedReturnUrl = returnUrl || `${clientOrigin}/dashboard/billing`;

    const portal = await stripeService.createCustomerPortalSession({
      user,
      returnUrl: resolvedReturnUrl,
    });

    return res.status(200).json({
      success: true,
      url: portal.url,
      isMock: portal.isMock,
    });
  } catch (error) {
    console.error('[createCustomerPortalSession Error]', error);
    return res.status(400).json({
      success: false,
      error: 'BillingError',
      message: error.message || 'Failed to create Customer Portal session.',
    });
  }
}

/**
 * Secure Stripe Webhook Listener
 * POST /api/billing/webhook
 *
 * Verifies rawBody against Stripe signature header and updates PostgreSQL
 */
export async function handleStripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  const rawBody = req.rawBody;

  let event;

  try {
    event = stripeService.constructWebhookEvent(rawBody, signature);
  } catch (err) {
    console.error('[Stripe Webhook Signature Verification Error]:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Webhook Error',
      message: `Signature verification failed: ${err.message}`,
    });
  }

  console.log(`[Stripe Webhook] Processing event: ${event.type} (ID: ${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        const plan = (session.metadata?.plan || 'BASIC').toUpperCase();
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: plan === 'PRO' ? 'PRO' : 'BASIC',
              subscriptionStatus: 'ACTIVE',
              stripeCustomerId: customerId ? String(customerId) : undefined,
              stripeSubscriptionId: subscriptionId ? String(subscriptionId) : undefined,
            },
          });
          console.log(`[Stripe Webhook] Promoted User ${userId} to ${plan} (Subscription: ${subscriptionId})`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = String(subscription.customer);
        const status = subscription.status; // 'active', 'past_due', 'canceled', etc.

        const statusMap = {
          active: 'ACTIVE',
          past_due: 'PAST_DUE',
          canceled: 'CANCELED',
          unpaid: 'PAST_DUE',
          trialing: 'TRIAL',
        };

        const targetStatus = statusMap[status] || 'ACTIVE';

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscription.id },
              { stripeCustomerId: customerId },
            ],
          },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: targetStatus,
              stripeSubscriptionId: subscription.id,
            },
          });
          console.log(`[Stripe Webhook] Updated User ${user.id} subscription to ${targetStatus}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = String(subscription.customer);

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscription.id },
              { stripeCustomerId: customerId },
            ],
          },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: 'FREE',
              subscriptionStatus: 'CANCELED',
            },
          });
          console.log(`[Stripe Webhook] Reverted User ${user.id} to FREE (Subscription Cancelled)`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = String(invoice.customer);

        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscriptionStatus: 'ACTIVE' },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = String(invoice.customer);

        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscriptionStatus: 'PAST_DUE' },
          });
          console.warn(`[Stripe Webhook] Payment failed for customer ${customerId}`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook Execution Error]', error);
    // Return 200 to acknowledge webhook so Stripe doesn't incessantly retry on business logic errors
    return res.status(200).json({ received: true, warning: error.message });
  }
}

export default {
  getCurrentPlan,
  createCheckoutSession,
  createCustomerPortalSession,
  handleStripeWebhook,
};
