import { Worker } from 'bullmq';
import config from '../config/env.js';
import redisConnection from '../config/redis.js';
import prisma from '../db/prisma.js';
import {
  extractCustomerData,
  buildTemplateMessage,
  isCodOrder,
  buildCodInteractiveMessage,
  getNotificationRule,
  buildDynamicTemplate,
} from '../utils/templateMapper.js';
import {
  sendMessage,
  sendInteractiveButtonMessage,
  WhatsAppApiError,
} from '../services/whatsappService.js';
import { sendSms, stripWhatsAppMarkdown } from '../services/smsService.js';

/**
 * Checks if a customer who abandoned a checkout has already completed an order in the meantime.
 *
 * @param {string} storeId - Store UUID
 * @param {Object} params
 * @param {string} params.customerPhone - Normalized customer phone
 * @param {string} [params.customerEmail] - Customer email address
 * @param {Object} [params.payload] - Raw checkout payload
 * @param {string|Date} [params.checkoutCreatedAt] - When checkout was initiated
 * @returns {Promise<boolean>} True if customer already purchased (organic recovery)
 */
export async function checkRecentOrderForCustomer(storeId, { customerPhone, customerEmail, payload = {}, checkoutCreatedAt } = {}) {
  // 1. Direct payload indicators (Shopify sets completed_at or order_id once converted)
  if (
    payload.completed_at != null ||
    payload.order_id != null ||
    payload.order != null ||
    String(payload.financial_status || '').toLowerCase() === 'paid'
  ) {
    return true;
  }

  // 2. Determine lookback threshold (since checkout was created or last 24h)
  const lookbackDate = checkoutCreatedAt
    ? new Date(new Date(checkoutCreatedAt).getTime() - 2 * 60 * 1000) // 2 min buffer
    : new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    // 3. Check recent order MessageLogs in PostgreSQL for this store
    const recentLogs = await prisma.messageLog.findMany({
      where: {
        storeId,
        createdAt: { gte: lookbackDate },
        status: { not: 'FAILED' },
        OR: [
          { customerPhone },
          ...(customerEmail
            ? [
                {
                  metadata: {
                    path: ['customerEmail'],
                    equals: customerEmail,
                  },
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        metadata: true,
      },
      take: 20,
    });

    const hasOrderLog = recentLogs.some((l) => {
      const topic = String(l.metadata?.topic || '').toLowerCase();
      const trigger = String(l.metadata?.triggerEvent || '').toUpperCase();
      return (
        topic.includes('orders/create') ||
        topic.includes('order.created') ||
        topic.includes('orders/paid') ||
        trigger === 'ORDER_CREATED' ||
        trigger === 'COD_VERIFICATION'
      );
    });

    if (hasOrderLog) return true;

    // 4. Check OrderVerification table for any recent order from this phone
    const recentVerification = await prisma.orderVerification.findFirst({
      where: {
        storeId,
        customerPhone,
        createdAt: { gte: lookbackDate },
      },
      select: { id: true },
    });

    if (recentVerification) return true;
  } catch (err) {
    console.warn(`[Worker] checkRecentOrderForCustomer check warning:`, err.message);
  }

  return false;
}

/**
 * Core job processor for incoming webhook jobs
 *
 * Steps:
 * 1. Extract and standardize customer, order, and phone details via templateMapper.
 * 2. If phone is invalid, record FAILED MessageLog and terminate job.
 * 3. If COD order: create OrderVerification record and send Interactive Confirm/Cancel Buttons.
 * 4. Otherwise: construct WhatsApp template components and call sendMessage.
 * 5. Record MessageLog in Prisma (SENT or FAILED) and link to OrderVerification.
 *
 * @param {import('bullmq').Job} job
 * @returns {Promise<Object>} Execution result
 */
export async function processWebhookJob(job) {
  const { storeId, storeUrl, platform, topic, payload, headers } = job.data;
  console.log(`[Worker] Processing job ${job.id} | Store: ${storeUrl} (${platform}) | Topic: ${topic}`);

  // 1. Fetch store record if needed for store-specific access tokens
  let store = null;
  try {
    store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { user: true },
    });
  } catch (err) {
    console.warn(`[Worker] Store lookup warning for ${storeId}:`, err.message);
  }

  if (!store) {
    console.warn(`[Worker] Job ${job.id} skipped: Store ${storeId} not found or has been deleted.`);
    return {
      success: true,
      skipped: true,
      reason: 'STORE_NOT_FOUND',
    };
  }

  // 2. Parse payload using templateMapper
  const customerData = extractCustomerData(payload, platform);
  const { customerName, normalizedPhone, rawPhone, orderNumber, formattedTotal } = customerData;

  // 3. Handle missing or invalid customer phone
  if (!normalizedPhone) {
    const errorMsg = `No valid international phone number found in payload (raw: "${rawPhone || 'none'}").`;
    console.warn(`[Worker] Job ${job.id} skipped message dispatch: ${errorMsg}`);

    // Audit failed delivery in Prisma MessageLog
    try {
      await prisma.messageLog.create({
        data: {
          storeId,
          customerPhone: rawPhone || 'UNKNOWN_PHONE',
          status: 'FAILED',
          channel: 'WHATSAPP',
          metadata: {
            jobId: job.id,
            topic,
            reason: 'INVALID_OR_MISSING_PHONE',
            error: errorMsg,
            customerName,
            orderNumber,
          },
        },
      });
    } catch (dbErr) {
      console.error(`[Worker] Failed to write MessageLog:`, dbErr.message);
    }

    return {
      success: false,
      reason: 'INVALID_OR_MISSING_PHONE',
      message: errorMsg,
    };
  }

  // 4. Determine Trigger Event & Fetch Notification Rule
  const isCod = String(topic).toLowerCase().includes('order') && isCodOrder(payload);
  let triggerEvent = 'ORDER_CREATED';
  if (isCod) {
    triggerEvent = 'COD_VERIFICATION';
  } else if (String(topic).toLowerCase().includes('abandon') || String(topic).toLowerCase().includes('checkout')) {
    triggerEvent = 'ABANDONED_CHECKOUT';
  } else if (String(topic).toLowerCase().includes('fulfill') || String(topic).toLowerCase().includes('ship')) {
    triggerEvent = 'ORDER_FULFILLED';
  }

  // Query store's notification automation rule
  const notificationRule = await getNotificationRule(storeId, triggerEvent);

  // If automation rule is explicitly disabled, skip sending message
  if (notificationRule && notificationRule.isEnabled === false) {
    console.log(
      `[Worker] ⏸️ Automation rule for "${triggerEvent}" is DISABLED on store "${store?.storeUrl}". Skipping notification.`
    );

    let skippedLog = null;
    try {
      skippedLog = await prisma.messageLog.create({
        data: {
          storeId,
          customerPhone: normalizedPhone,
          status: 'PENDING',
          channel: 'WHATSAPP',
          metadata: {
            jobId: job.id,
            topic,
            triggerEvent,
            skipped: true,
            reason: 'AUTOMATION_DISABLED',
            templateName: notificationRule.templateName,
            customerName,
            orderNumber,
          },
        },
      });
    } catch (dbErr) {
      console.error(`[Worker] Failed to write skipped MessageLog:`, dbErr.message);
    }

    return {
      success: true,
      skipped: true,
      reason: 'AUTOMATION_DISABLED',
      triggerEvent,
      messageLogId: skippedLog?.id,
    };
  }

  // 4b. Check if customer already purchased (Organic Conversion Check for Abandoned Checkouts)
  if (triggerEvent === 'ABANDONED_CHECKOUT') {
    const isRecoveredOrganically = await checkRecentOrderForCustomer(storeId, {
      customerPhone: normalizedPhone,
      customerEmail: customerData.customerEmail || payload.email || payload.customer?.email,
      payload,
      checkoutCreatedAt: payload.created_at || payload.updated_at || job.data?.receivedAt,
    });

    if (isRecoveredOrganically) {
      console.log(
        `[Worker] 🛒 Customer ${normalizedPhone} has already completed their purchase. Skipping abandoned checkout recovery (RECOVERED_ORGANICALLY).`
      );

      let skippedLog = null;
      try {
        skippedLog = await prisma.messageLog.create({
          data: {
            storeId,
            customerPhone: normalizedPhone,
            status: 'SENT',
            channel: 'WHATSAPP',
            metadata: {
              jobId: job.id,
              topic,
              triggerEvent,
              skipped: true,
              reason: 'RECOVERED_ORGANICALLY',
              recoveredOrganically: true,
              templateName: notificationRule?.templateName || 'abandoned_cart_recovery',
              customerName,
              customerEmail: customerData.customerEmail || payload.email || payload.customer?.email || null,
              checkoutUrl: customerData.checkoutUrl || null,
              orderNumber,
              recoveredAt: new Date().toISOString(),
            },
          },
        });
      } catch (dbErr) {
        console.error(`[Worker] Failed to write RECOVERED_ORGANICALLY MessageLog:`, dbErr.message);
      }

      return {
        success: true,
        skipped: true,
        reason: 'RECOVERED_ORGANICALLY',
        triggerEvent,
        messageLogId: skippedLog?.id,
      };
    }
  }

  let orderVerification = null;

  if (isCod) {
    const orderRef =
      customerData.orderId ||
      customerData.orderNumber?.replace('#', '') ||
      String(payload.id || Date.now());

    try {
      orderVerification = await prisma.orderVerification.create({
        data: {
          storeId,
          orderId: orderRef,
          orderNumber: customerData.orderNumber || `#${orderRef}`,
          customerPhone: normalizedPhone,
          customerName: customerData.customerName,
          totalAmount: customerData.formattedTotal,
          currency: customerData.currency || 'USD',
          status: 'PENDING',
          channel: 'WHATSAPP',
          metadata: {
            jobId: job.id,
            gateway: payload.gateway || payload.payment_gateway_names?.[0] || 'Cash on Delivery',
            financialStatus: payload.financial_status,
          },
        },
      });
      console.log(
        `[Worker] Created COD OrderVerification ${orderVerification.id} (Status: PENDING) for order ${orderRef}`
      );
    } catch (dbErr) {
      console.error(`[Worker] Failed to create OrderVerification record:`, dbErr.message);
    }
  }

  // 5. Send WhatsApp Message via Meta API
  let templateName = notificationRule?.templateName || (isCod ? 'cod_interactive_verification' : 'order_confirmation');

  try {
    // Priority: Store-level Meta credentials -> Merchant User Meta credentials -> store.accessToken -> system fallback
    const resolvedToken =
      store?.metaAccessToken ||
      store?.user?.metaAccessToken ||
      store?.accessToken ||
      undefined;

    const resolvedPhoneNumberId =
      store?.metaPhoneNumberId ||
      store?.user?.metaPhoneNumberId ||
      undefined;

    let sendResult;

    if (isCod) {
      // Dispatch Meta Interactive Message with Confirm / Cancel Quick Reply buttons
      const interactiveConfig = buildCodInteractiveMessage(customerData, notificationRule);
      sendResult = await sendInteractiveButtonMessage(
        normalizedPhone,
        interactiveConfig,
        resolvedToken,
        { phoneNumberId: resolvedPhoneNumberId }
      );
      templateName = notificationRule?.templateName || 'cod_interactive_verification';
    } else {
      // Dispatch dynamic template message with custom variable mapping
      const dynamicTemplate = buildDynamicTemplate(notificationRule, customerData, payload, store);
      templateName = dynamicTemplate.templateName;
      sendResult = await sendMessage(
        normalizedPhone,
        templateName,
        dynamicTemplate.components,
        resolvedToken,
        {
          phoneNumberId: resolvedPhoneNumberId,
          languageCode: dynamicTemplate.languageCode || notificationRule?.languageCode || 'en',
        }
      );
    }

    console.log(
      `[Worker] ✅ WhatsApp sent to ${normalizedPhone} (Message ID: ${sendResult.messageId}) [COD: ${isCod}]`
    );

    // 6. Record successful MessageLog in Prisma
    let createdLog = null;
    try {
      const logData = {
        storeId,
        customerPhone: normalizedPhone,
        status: 'SENT',
        channel: 'WHATSAPP',
        metadata: {
          jobId: job.id,
          messageId: sendResult.messageId,
          topic,
          triggerEvent,
          templateName,
          customerName,
          customerEmail: customerData.customerEmail || payload.email || payload.customer?.email || null,
          checkoutUrl: customerData.checkoutUrl || null,
          orderNumber,
          formattedTotal,
          isCod,
          orderVerificationId: orderVerification?.id || null,
          dispatchedAt: new Date().toISOString(),
        },
      };

      if (orderVerification) {
        logData.orderVerification = { connect: { id: orderVerification.id } };
      }

      createdLog = await prisma.messageLog.create({ data: logData });
    } catch (dbErr) {
      console.error(`[Worker] DB logging warning (MessageLog SENT):`, dbErr.message);
    }

    return {
      success: true,
      messageId: sendResult.messageId,
      recipient: normalizedPhone,
      templateName,
      isCod,
      orderVerificationId: orderVerification?.id || null,
      messageLogId: createdLog?.id || null,
    };
  } catch (apiError) {
    console.error(`[Worker] ❌ WhatsApp delivery failed for job ${job.id}:`, apiError.message);

    // Check if error indicates customer is not on WhatsApp (Meta error code 131026 or undeliverable)
    const isNotOnWhatsApp =
      apiError.errorCode === 131026 ||
      apiError.errorSubcode === 131026 ||
      String(apiError.message).toLowerCase().includes('not on whatsapp') ||
      String(apiError.message).toLowerCase().includes('undeliverable') ||
      String(apiError.message).includes('131026');

    const shouldFallbackToSms = Boolean(
      isNotOnWhatsApp &&
      notificationRule?.fallbackToSms &&
      store?.smsProvider &&
      store?.smsCredentials
    );

    if (shouldFallbackToSms) {
      console.log(`[Worker] 🔀 Customer not on WhatsApp (Error 131026). Triggering SMS Fallback via ${store.smsProvider}...`);

      try {
        // Construct clean plain-text message for SMS
        let rawMessageText = notificationRule?.bodyText;

        if (rawMessageText) {
          // Dynamic variable interpolation
          rawMessageText = rawMessageText
            .replace(/\{\{1\}\}/g, customerData.customerName || 'Customer')
            .replace(/\{\{2\}\}/g, customerData.orderNumber || '#Order')
            .replace(/\{\{3\}\}/g, customerData.formattedTotal || '$0.00');
        } else if (isCod) {
          rawMessageText = `Hi ${customerData.customerName || 'Customer'}, please verify your Cash on Delivery order ${customerData.orderNumber || '#Order'} for ${customerData.formattedTotal || ''}. Reply YES to confirm or NO to cancel.`;
        } else if (triggerEvent === 'ABANDONED_CHECKOUT') {
          rawMessageText = `Hi ${customerData.customerName || 'Customer'}, you left items in your cart totaling ${customerData.formattedTotal || ''}! Complete your order here: ${customerData.checkoutUrl || ''}`;
        } else {
          rawMessageText = `Hi ${customerData.customerName || 'Customer'}, thank you for your order ${customerData.orderNumber || '#Order'} for ${customerData.formattedTotal || ''}!`;
        }

        const plainSms = stripWhatsAppMarkdown(rawMessageText);

        const smsDispatch = await sendSms({
          provider: store.smsProvider,
          credentials: store.smsCredentials,
          senderId: store.smsSenderId,
          to: normalizedPhone,
          message: plainSms,
        });

        // Record SMS_FALLBACK MessageLog in PostgreSQL
        const fallbackLogData = {
          storeId,
          customerPhone: normalizedPhone,
          status: 'SMS_FALLBACK',
          channel: 'SMS',
          metadata: {
            jobId: job.id,
            topic,
            triggerEvent,
            templateName: isCod ? 'cod_interactive_verification' : templateName,
            customerName,
            customerEmail: customerData.customerEmail || payload.email || payload.customer?.email || null,
            checkoutUrl: customerData.checkoutUrl || null,
            orderNumber,
            formattedTotal,
            isCod,
            orderVerificationId: orderVerification?.id || null,
            fallback: true,
            fallbackReason: 'USER_NOT_ON_WHATSAPP',
            originalError: apiError.message,
            originalErrorCode: apiError.errorCode,
            smsProvider: store.smsProvider,
            smsMessageId: smsDispatch.messageId,
            smsText: plainSms,
            dispatchedAt: new Date().toISOString(),
          },
        };

        if (orderVerification) {
          fallbackLogData.orderVerification = { connect: { id: orderVerification.id } };
          await prisma.orderVerification.update({
            where: { id: orderVerification.id },
            data: { channel: 'SMS' },
          }).catch(() => {});
        }

        const createdFallbackLog = await prisma.messageLog.create({ data: fallbackLogData });
        console.log(`[Worker] ✅ SMS Fallback successfully sent to ${normalizedPhone} (ID: ${smsDispatch.messageId}) [MessageLog: ${createdFallbackLog.id}]`);

        return {
          success: true,
          fallback: true,
          channel: 'SMS',
          provider: store.smsProvider,
          messageId: smsDispatch.messageId,
          recipient: normalizedPhone,
          orderVerificationId: orderVerification?.id || null,
          messageLogId: createdFallbackLog.id,
        };
      } catch (smsErr) {
        console.error(`[Worker] ❌ SMS Fallback dispatch also failed:`, smsErr.message);
      }
    }

    // 7. Record failed MessageLog in Prisma
    try {
      const logData = {
        storeId,
        customerPhone: normalizedPhone,
        status: 'FAILED',
        channel: 'WHATSAPP',
        metadata: {
          jobId: job.id,
          topic,
          triggerEvent,
          templateName: isCod ? 'cod_interactive_verification' : templateName,
          customerName,
          customerEmail: customerData.customerEmail || payload.email || payload.customer?.email || null,
          checkoutUrl: customerData.checkoutUrl || null,
          isCod,
          orderVerificationId: orderVerification?.id || null,
          error: apiError.message,
          errorCode: apiError.errorCode,
          errorSubcode: apiError.errorSubcode,
          isRateLimit: apiError.isRateLimit,
          failedAt: new Date().toISOString(),
        },
      };

      if (orderVerification) {
        logData.orderVerification = { connect: { id: orderVerification.id } };
      }

      await prisma.messageLog.create({ data: logData });
    } catch (dbErr) {
      console.error(`[Worker] DB logging warning (MessageLog FAILED):`, dbErr.message);
    }


    // If rate limited or network failure, rethrow so BullMQ retries the job
    if (apiError.isRateLimit || apiError.statusCode === 504 || apiError.statusCode >= 500) {
      throw apiError;
    }

    // Permanent errors (e.g. template not found, invalid parameters) complete without failing BullMQ retry loop
    return {
      success: false,
      error: apiError.message,
      errorCode: apiError.errorCode,
    };
  }
}

/**
 * Initialize and start the BullMQ worker
 * @param {Object} [customConnection] - Optional custom Redis connection
 * @returns {Worker}
 */
export function createWebhookWorker(customConnection = redisConnection) {
  const worker = new Worker(config.queue.webhookQueueName, processWebhookJob, {
    connection: customConnection,
    concurrency: 10,
  });

  worker.on('ready', () => {
    console.log(`[Worker] Worker ready and listening on queue "${config.queue.webhookQueueName}"`);
  });

  worker.on('completed', (job, result) => {
    console.log(`[Worker] Completed job ${job.id} (success: ${result?.success})`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
  });

  worker.on('error', (err) => {
    console.error(`[Worker] Redis connection error:`, err.message);
  });

  return worker;
}

export default createWebhookWorker;
