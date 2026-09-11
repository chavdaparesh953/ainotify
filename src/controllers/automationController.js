import prisma from '../db/prisma.js';

export const DEFAULT_RULES = [
  {
    triggerEvent: 'ORDER_CREATED',
    isEnabled: true,
    templateName: 'order_confirmation',
    languageCode: 'en',
    variableMap: {
      '1': 'customer.name',
      '2': 'order.number',
      '3': 'order.formatted_total',
    },
    bodyText: 'Hi {{1}}, thank you for your order {{2}} for {{3}}!',
  },
  {
    triggerEvent: 'COD_VERIFICATION',
    isEnabled: true,
    templateName: 'cod_interactive_verification',
    languageCode: 'en',
    variableMap: {
      '1': 'customer.name',
      '2': 'order.number',
      '3': 'order.formatted_total',
    },
    headerText: 'COD Order Verification',
    bodyText: 'Hi {{1}}, please verify your Cash on Delivery order {{2}} for {{3}}.',
    footerText: 'WaNotify Verification',
  },
  {
    triggerEvent: 'ABANDONED_CHECKOUT',
    isEnabled: false,
    templateName: 'abandoned_cart_recovery',
    languageCode: 'en',
    variableMap: {
      '1': 'customer.name',
      '2': 'order.formatted_total',
    },
    bodyText: 'Hi {{1}}, you left items in your cart totaling {{2}}! Complete your purchase now.',
  },
  {
    triggerEvent: 'ORDER_FULFILLED',
    isEnabled: false,
    templateName: 'order_shipped',
    languageCode: 'en',
    variableMap: {
      '1': 'customer.name',
      '2': 'order.number',
    },
    bodyText: 'Good news {{1}}! Your order {{2}} has been shipped and is on its way.',
  },
];

/**
 * Fetch all notification rules for a store (initializing default rules if empty)
 * GET /api/automations/:storeId
 */
export async function getStoreRules(req, res) {
  try {
    const storeId = req.params.storeId || req.query.storeId;
    const userId = req.user.id;

    if (!storeId) {
      return res.status(400).json({ success: false, error: 'Store ID is required' });
    }

    // Verify merchant ownership of the store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId,
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Store not found or does not belong to your account',
      });
    }

    let existingRules = await prisma.notificationRule.findMany({
      where: { storeId },
      orderBy: { createdAt: 'asc' },
    });

    // If no rules exist, initialize defaults
    if (existingRules.length === 0) {
      await prisma.notificationRule.createMany({
        data: DEFAULT_RULES.map((rule) => ({
          ...rule,
          storeId,
        })),
      });

      existingRules = await prisma.notificationRule.findMany({
        where: { storeId },
        orderBy: { createdAt: 'asc' },
      });
    } else {
      // Check if any default triggerEvent is missing and backfill it
      const existingEvents = new Set(existingRules.map((r) => r.triggerEvent));
      const missingEvents = DEFAULT_RULES.filter((d) => !existingEvents.has(d.triggerEvent));

      if (missingEvents.length > 0) {
        await prisma.notificationRule.createMany({
          data: missingEvents.map((rule) => ({
            ...rule,
            storeId,
          })),
        });

        existingRules = await prisma.notificationRule.findMany({
          where: { storeId },
          orderBy: { createdAt: 'asc' },
        });
      }
    }

    return res.status(200).json({
      success: true,
      store: {
        id: store.id,
        storeUrl: store.storeUrl,
        platform: store.platform,
      },
      rules: existingRules,
    });
  } catch (error) {
    console.error('[AutomationController getStoreRules Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Upsert a single notification rule for a store
 * PUT /api/automations/:storeId/rule
 */
export async function updateStoreRule(req, res) {
  try {
    const storeId = req.params.storeId;
    const userId = req.user.id;
    const {
      triggerEvent,
      isEnabled,
      fallbackToSms,
      templateName,
      languageCode,
      variableMap,
      headerText,
      bodyText,
      footerText,
    } = req.body;

    if (!storeId || !triggerEvent) {
      return res.status(400).json({
        success: false,
        error: 'storeId and triggerEvent are required',
      });
    }

    // Verify merchant ownership of the store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId,
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Store not found or does not belong to your account',
      });
    }

    const updatedRule = await prisma.notificationRule.upsert({
      where: {
        storeId_triggerEvent: {
          storeId,
          triggerEvent,
        },
      },
      create: {
        storeId,
        triggerEvent,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
        fallbackToSms: fallbackToSms !== undefined ? Boolean(fallbackToSms) : false,
        templateName: templateName || 'order_confirmation',
        languageCode: languageCode || 'en',
        variableMap: variableMap || {},
        headerText: headerText !== undefined ? headerText : null,
        bodyText: bodyText !== undefined ? bodyText : null,
        footerText: footerText !== undefined ? footerText : null,
      },
      update: {
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : undefined,
        fallbackToSms: fallbackToSms !== undefined ? Boolean(fallbackToSms) : undefined,
        templateName: templateName !== undefined ? templateName : undefined,
        languageCode: languageCode !== undefined ? languageCode : undefined,
        variableMap: variableMap !== undefined ? variableMap : undefined,
        headerText: headerText !== undefined ? headerText : undefined,
        bodyText: bodyText !== undefined ? bodyText : undefined,
        footerText: footerText !== undefined ? footerText : undefined,
      },
    });

    return res.status(200).json({
      success: true,
      rule: updatedRule,
      message: `Rule for ${triggerEvent} updated successfully`,
    });
  } catch (error) {
    console.error('[AutomationController updateStoreRule Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Batch update/upsert multiple notification rules for a store
 * PUT /api/automations/:storeId/batch
 */
export async function batchUpdateStoreRules(req, res) {
  try {
    const storeId = req.params.storeId;
    const userId = req.user.id;
    const { rules } = req.body;

    if (!storeId || !Array.isArray(rules)) {
      return res.status(400).json({
        success: false,
        error: 'storeId and an array of rules are required',
      });
    }

    // Verify merchant ownership of the store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId,
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Store not found or does not belong to your account',
      });
    }

    const updatedRules = [];

    for (const r of rules) {
      if (!r.triggerEvent) continue;

      const rule = await prisma.notificationRule.upsert({
        where: {
          storeId_triggerEvent: {
            storeId,
            triggerEvent: r.triggerEvent,
          },
        },
        create: {
          storeId,
          triggerEvent: r.triggerEvent,
          isEnabled: r.isEnabled !== undefined ? Boolean(r.isEnabled) : true,
          templateName: r.templateName || 'order_confirmation',
          languageCode: r.languageCode || 'en',
          variableMap: r.variableMap || {},
          headerText: r.headerText || null,
          bodyText: r.bodyText || null,
          footerText: r.footerText || null,
        },
        update: {
          isEnabled: r.isEnabled !== undefined ? Boolean(r.isEnabled) : undefined,
          templateName: r.templateName !== undefined ? r.templateName : undefined,
          languageCode: r.languageCode !== undefined ? r.languageCode : undefined,
          variableMap: r.variableMap !== undefined ? r.variableMap : undefined,
          headerText: r.headerText !== undefined ? r.headerText : undefined,
          bodyText: r.bodyText !== undefined ? r.bodyText : undefined,
          footerText: r.footerText !== undefined ? r.footerText : undefined,
        },
      });
      updatedRules.push(rule);
    }

    return res.status(200).json({
      success: true,
      rules: updatedRules,
      message: `${updatedRules.length} automation rules updated successfully`,
    });
  } catch (error) {
    console.error('[AutomationController batchUpdateStoreRules Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default {
  getStoreRules,
  updateStoreRule,
  batchUpdateStoreRules,
  DEFAULT_RULES,
};
