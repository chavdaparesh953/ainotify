import prisma from '../db/prisma.js';
import config from '../config/env.js';
import { sendMessage } from '../services/whatsappService.js';
import { syncOrderToStore } from '../services/ecommerceService.js';

/**
 * Meta Webhook Handshake Verification
 * GET /api/webhooks/meta
 *
 * Validates the hub.verify_token sent by Meta against our configured token.
 * If valid, responds with the hub.challenge integer/string to confirm webhook registration.
 */
export async function verifyMetaWebhook(req, res) {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const expectedToken = config.meta.webhookVerifyToken || 'omnipulse_meta_verify_token_123';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('[MetaWebhook] ✅ Webhook verification handshake successful (hub.challenge responded)');
      return res.status(200).send(challenge);
    }

    console.warn(`[MetaWebhook] ❌ Verification token mismatch. Received: "${token}", Expected: "${expectedToken}"`);
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Verification token mismatch',
    });
  } catch (error) {
    console.error('[MetaWebhook Handshake Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Inbound Meta WhatsApp Event Ingestion
 * POST /api/webhooks/meta
 *
 * Listens for customer button clicks (Interactive button_reply or Quick Reply button)
 * and updates COD OrderVerification statuses in PostgreSQL.
 */
export async function handleMetaWebhook(req, res) {
  try {
    const body = req.body || {};

    // Validate Meta envelope
    if (body.object !== 'whatsapp_business_account') {
      return res.status(200).json({ success: true, message: 'Non-WhatsApp event ignored' });
    }

    const entries = Array.isArray(body.entry) ? body.entry : [];
    const processedEvents = [];

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];

      for (const change of changes) {
        const value = change.value || {};
        const messages = Array.isArray(value.messages) ? value.messages : [];

        for (const message of messages) {
          const fromPhone = message.from ? String(message.from).replace(/\D/g, '') : null;
          const messageId = message.id;

          // Extract button reply payload or text
          let buttonPayload = '';
          let buttonTitle = '';

          if (message.type === 'interactive' && message.interactive?.button_reply) {
            buttonPayload = String(message.interactive.button_reply.id || '');
            buttonTitle = String(message.interactive.button_reply.title || '');
          } else if (message.type === 'button' && message.button) {
            buttonPayload = String(message.button.payload || '');
            buttonTitle = String(message.button.text || '');
          } else if (message.type === 'text' && message.text?.body) {
            buttonTitle = String(message.text.body || '');
          }

          const isConfirm =
            buttonPayload.includes('cod_confirm') ||
            /confirm|yes|verified/i.test(buttonTitle);

          const isCancel =
            buttonPayload.includes('cod_cancel') ||
            /cancel|no|reject/i.test(buttonTitle);

          if (!isConfirm && !isCancel) {
            continue;
          }

          // Extract potential order ID from button payload (e.g., "cod_confirm_777001" -> "777001")
          let extractedOrderId = null;
          const match = buttonPayload.match(/cod_(?:confirm|cancel)_(.+)/);
          if (match && match[1]) {
            extractedOrderId = match[1];
          }

          // Locate matching OrderVerification record
          // Priority 1: match by orderId
          // Priority 2: match latest PENDING verification by customer phone
          let verification = null;
          if (extractedOrderId) {
            verification = await prisma.orderVerification.findFirst({
              where: {
                OR: [
                  { orderId: extractedOrderId },
                  { orderNumber: extractedOrderId },
                  { orderNumber: `#${extractedOrderId}` },
                ],
              },
              include: { store: true },
            });
          }

          if (!verification && fromPhone) {
            verification = await prisma.orderVerification.findFirst({
              where: {
                customerPhone: { endsWith: fromPhone.slice(-10) },
                status: 'PENDING',
              },
              orderBy: { createdAt: 'desc' },
              include: { store: true },
            });
          }

          if (verification) {
            const newStatus = isConfirm ? 'CONFIRMED' : 'CANCELLED';
            const updatedMetadata = {
              ...(typeof verification.metadata === 'object' && verification.metadata !== null ? verification.metadata : {}),
              buttonPayload,
              buttonTitle,
              metaMessageId: messageId,
              customerPhone: fromPhone,
              updatedVia: 'INBOUND_META_WEBHOOK',
            };

            const updatedVerification = await prisma.orderVerification.update({
              where: { id: verification.id },
              data: {
                status: newStatus,
                confirmedAt: isConfirm ? new Date() : verification.confirmedAt,
                cancelledAt: isCancel ? new Date() : verification.cancelledAt,
                metadata: updatedMetadata,
              },
            });

            console.log(
              `[MetaWebhook] ✅ OrderVerification ${verification.id} updated to "${newStatus}" for Order ${verification.orderNumber}`
            );

            // Step 12: Trigger automated two-way order write-back to merchant store (Shopify / WooCommerce)
            let syncStatusResult = 'PENDING';
            try {
              const syncResult = await syncOrderToStore(verification, newStatus);
              syncStatusResult = syncResult?.syncStatus || 'SYNCED';
            } catch (syncErr) {
              console.error(`[MetaWebhook] Store sync failed for order ${verification.orderId}:`, syncErr.message);
              syncStatusResult = 'FAILED';
            }

            processedEvents.push({
              verificationId: verification.id,
              orderId: verification.orderId,
              status: newStatus,
              syncStatus: syncStatusResult,
            });
          } else {
            console.warn(
              `[MetaWebhook] No matching OrderVerification found for payload="${buttonPayload}" fromPhone="${fromPhone}"`
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      processed: true,
      events: processedEvents,
    });
  } catch (error) {
    console.error('[MetaWebhook Handle Error]', error);
    // Respond 200 OK so Meta does not keep retrying transient parse errors
    return res.status(200).json({ success: false, error: error.message });
  }
}

export default {
  verifyMetaWebhook,
  handleMetaWebhook,
};
