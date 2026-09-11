import config from '../config/env.js';
import prisma from '../db/prisma.js';

/**
 * Default fallback automation rules
 */
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
    bodyText: 'Hi {{1}}, please verify your Cash on Delivery order {{2}} for {{3}}. Please click below to confirm or cancel your shipment:',
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
      '3': 'checkout.abandoned_checkout_url',
    },
    bodyText: 'Hi {{1}}, you left items in your cart totaling {{2}}! Complete your purchase here: {{3}}',
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
 * Normalizes phone numbers to standard international digits-only format
 * suitable for Meta WhatsApp Cloud API (e.g., "15551234567" or "919876543210").
 *
 * @param {string} rawPhone - Raw input phone string (e.g., "+1 (555) 123-4567")
 * @param {string} [defaultCountryCode] - Fallback country code if not present (default: config.meta.defaultCountryCode)
 * @returns {string|null} Sanitized international digits string or null if invalid
 */
export function normalizePhoneNumber(rawPhone, defaultCountryCode = config.meta.defaultCountryCode || '1') {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return null;
  }

  // 1. Strip all non-digit characters
  let digits = rawPhone.replace(/\D/g, '');

  // 2. Remove leading international exit codes (e.g., "00" prefix)
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // 3. Remove single leading trunk zero (common in local national formats, e.g., "0987654321")
  if (digits.startsWith('0') && digits.length > 10) {
    digits = digits.slice(1);
  }

  // 4. If number is 10 digits (e.g., North American or Indian standard without code), prepend country code
  if (digits.length === 10) {
    digits = `${defaultCountryCode.replace(/\D/g, '')}${digits}`;
  }

  // 5. Valid E.164 phone length is between 10 and 15 digits
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  return digits;
}

/**
 * Universal extractor for customer and order details from Shopify,
 * WooCommerce, or generic automation payloads.
 *
 * @param {Object} payload - Raw e-commerce webhook payload
 * @param {string} [platform] - SHOPIFY, WOOCOMMERCE, or custom
 * @returns {Object} Extracted customer and order summary
 */
export function extractCustomerData(payload = {}, platform = '') {
  // 1. Extract Customer Name
  const firstName =
    payload.shipping_address?.first_name ||
    payload.billing_address?.first_name ||
    payload.billing?.first_name ||
    payload.shipping?.first_name ||
    payload.customer?.first_name ||
    payload.first_name ||
    '';

  const lastName =
    payload.shipping_address?.last_name ||
    payload.billing_address?.last_name ||
    payload.billing?.last_name ||
    payload.shipping?.last_name ||
    payload.customer?.last_name ||
    payload.last_name ||
    '';

  const rawFullName =
    payload.shipping_address?.name ||
    payload.billing_address?.name ||
    payload.customer?.name ||
    payload.customerName ||
    payload.name ||
    '';

  let customerName = `${firstName} ${lastName}`.trim();
  if (!customerName) {
    customerName = rawFullName.trim() || 'Valued Customer';
  }

  // 2. Extract Customer Phone
  const rawPhone =
    payload.shipping_address?.phone ||
    payload.billing_address?.phone ||
    payload.billing?.phone ||
    payload.shipping?.phone ||
    payload.customer?.phone ||
    payload.customerPhone ||
    payload.phone ||
    payload.contact_phone ||
    null;

  const normalizedPhone = normalizePhoneNumber(rawPhone);

  // 3. Extract Order Total & Currency
  const rawTotal =
    payload.total_price ||
    payload.current_total_price ||
    payload.total ||
    payload.orderTotal ||
    payload.cart_total ||
    payload.cartValue ||
    '0.00';

  const currency =
    payload.currency ||
    payload.presentment_currency ||
    payload.currency_code ||
    'USD';

  const formattedTotal = `${currency} ${parseFloat(rawTotal || '0').toFixed(2)}`;

  // 4. Extract Order Identifier
  const orderNumber =
    payload.order_number != null
      ? `#${payload.order_number}`
      : payload.name ||
        (payload.id ? `#${payload.id}` : '#Order');

  // 5. Extract Customer Email & Checkout Recovery URL
  const customerEmail =
    payload.customer?.email ||
    payload.email ||
    payload.billing_address?.email ||
    payload.billing?.email ||
    null;

  const checkoutUrl =
    payload.abandoned_checkout_url ||
    payload.checkout?.abandoned_checkout_url ||
    payload.checkout_url ||
    payload.cart_url ||
    payload.recovery_url ||
    payload.cart?.recovery_url ||
    null;

  return {
    customerName,
    rawPhone,
    normalizedPhone,
    customerEmail,
    checkoutUrl,
    orderNumber,
    orderTotal: rawTotal,
    formattedTotal,
    currency,
    orderId: payload.id ? String(payload.id) : null,
  };
}

/**
 * Detects whether an incoming Shopify or WooCommerce order is Cash on Delivery (COD).
 *
 * @param {Object} payload - Raw order payload
 * @returns {boolean} True if order is Cash on Delivery
 */
export function isCodOrder(payload = {}) {
  if (!payload || typeof payload !== 'object') return false;

  const gateway = String(payload.gateway || '').toLowerCase();
  const paymentGateways = Array.isArray(payload.payment_gateway_names)
    ? payload.payment_gateway_names.map((g) => String(g).toLowerCase())
    : [];
  const paymentMethod = String(payload.payment_method || payload.payment_method_title || '').toLowerCase();
  const financialStatus = String(payload.financial_status || '').toLowerCase();

  const isCodMatch =
    gateway.includes('cod') ||
    gateway.includes('cash on delivery') ||
    gateway.includes('cash_on_delivery') ||
    gateway.includes('manual') ||
    paymentMethod.includes('cod') ||
    paymentMethod.includes('cash on delivery') ||
    paymentGateways.some(
      (g) =>
        g.includes('cod') ||
        g.includes('cash on delivery') ||
        g.includes('cash_on_delivery') ||
        g.includes('manual')
    );

  return isCodMatch || (financialStatus === 'pending' && (gateway || paymentGateways.length > 0));
}

/**
 * Resolves a dynamic template variable placeholder from the webhook event context.
 *
 * @param {string} pathOrKey - Variable name (e.g. 'customer.name', 'order.number', 'order.formatted_total')
 * @param {Object} context - { customer, order, payload, store }
 * @returns {string} Resolved string value
 */
export function resolveVariable(pathOrKey, contextOrCustomer = {}, maybePayload = {}, maybeStore = {}) {
  if (!pathOrKey) return '';
  const key = String(pathOrKey).trim().toLowerCase();

  // Support both resolveVariable(key, { customer, payload, store })
  // and resolveVariable(key, customer, payload, store)
  let customer, payload, store;
  if (
    contextOrCustomer &&
    typeof contextOrCustomer === 'object' &&
    ('customer' in contextOrCustomer || 'payload' in contextOrCustomer || 'store' in contextOrCustomer)
  ) {
    customer = contextOrCustomer.customer || {};
    payload = contextOrCustomer.payload || {};
    store = contextOrCustomer.store || {};
  } else {
    customer = contextOrCustomer || {};
    payload = maybePayload || {};
    store = maybeStore || {};
  }

  // Shortcuts & Common Aliases
  switch (key) {
    case 'customer.name':
    case 'customer_name':
    case 'customer.full_name':
      return customer.customerName || 'Valued Customer';
    case 'customer.first_name':
    case 'first_name':
      return (
        payload.shipping_address?.first_name ||
        payload.billing_address?.first_name ||
        payload.billing?.first_name ||
        payload.shipping?.first_name ||
        payload.customer?.first_name ||
        payload.first_name ||
        customer.customerName?.split(' ')[0] ||
        'Customer'
      );
    case 'customer.last_name':
    case 'last_name':
      return (
        payload.shipping_address?.last_name ||
        payload.billing_address?.last_name ||
        payload.billing?.last_name ||
        payload.shipping?.last_name ||
        payload.customer?.last_name ||
        payload.last_name ||
        ''
      );
    case 'customer.phone':
    case 'phone':
      return customer.normalizedPhone || customer.rawPhone || '';
    case 'order.number':
    case 'order_number':
      return customer.orderNumber || '#Order';
    case 'order.id':
    case 'order_id':
      return customer.orderId || String(payload.id || 'Order');
    case 'order.total':
    case 'order.formatted_total':
    case 'formatted_total':
    case 'total_price':
      return customer.formattedTotal || `${customer.currency || 'USD'} ${customer.orderTotal || '0.00'}`;
    case 'order.amount':
    case 'order.total_amount':
      return String(customer.orderTotal || '0.00');
    case 'order.currency':
    case 'currency':
      return customer.currency || 'USD';
    case 'store.name':
    case 'store_name':
      return store.storeUrl?.split('.')[0] || 'Our Store';
    case 'store.url':
    case 'store_url':
      return store.storeUrl || '';
    case 'checkout.abandoned_checkout_url':
    case 'abandoned_checkout_url':
    case 'checkout.url':
    case 'checkout_url':
    case 'recovery_url':
    case 'cart.recovery_url':
      return (
        customer.checkoutUrl ||
        payload.abandoned_checkout_url ||
        payload.checkout?.abandoned_checkout_url ||
        payload.checkout_url ||
        payload.cart_url ||
        payload.recovery_url ||
        ''
      );
    case 'customer.email':
    case 'email':
      return customer.customerEmail || payload.email || payload.customer?.email || '';
    default: {
      // Direct path traversal in payload
      const parts = key.split('.');
      let current = payload;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          current = undefined;
          break;
        }
      }
      if (current !== undefined && current !== null) {
        return String(current);
      }
      return '';
    }
  }
}

/**
 * Fetch a store's configured NotificationRule from the database,
 * falling back to default configuration if not yet persisted.
 *
 * @param {string} storeId - Store ID
 * @param {'ORDER_CREATED'|'COD_VERIFICATION'|'ABANDONED_CHECKOUT'|'ORDER_FULFILLED'} triggerEvent
 * @returns {Promise<Object>} NotificationRule record
 */
export async function getNotificationRule(storeId, triggerEvent) {
  if (!storeId || !triggerEvent) return null;

  try {
    const rule = await prisma.notificationRule.findUnique({
      where: {
        storeId_triggerEvent: {
          storeId,
          triggerEvent,
        },
      },
    });

    if (rule) return rule;
  } catch (err) {
    console.warn(`[TemplateMapper] Could not fetch rule from DB:`, err.message);
  }

  // Fallback to default rule
  const defaultRule = DEFAULT_RULES.find((r) => r.triggerEvent === triggerEvent);
  if (defaultRule) {
    return {
      ...defaultRule,
      storeId,
      id: `default_${triggerEvent.toLowerCase()}`,
    };
  }

  return null;
}

/**
 * Constructs dynamic Meta WhatsApp template components using the stored variableMap.
 *
 * @param {Object} rule - NotificationRule instance
 * @param {Object} customerData - Standardized customer/order data
 * @param {Object} [payload] - Raw webhook payload
 * @param {Object} [store] - Store model instance
 * @returns {{ templateName: string, languageCode: string, components: Array, parameters: Array }}
 */
export function buildDynamicTemplate(rule, customerData, payload = {}, store = {}) {
  const templateName = rule?.templateName || 'order_confirmation';
  const languageCode = rule?.languageCode || 'en';
  const variableMap = rule?.variableMap || {};

  const context = {
    customer: customerData,
    order: customerData,
    payload,
    store,
  };

  let params = [];

  if (Array.isArray(variableMap)) {
    params = variableMap
      .slice()
      .sort((a, b) => parseInt(a.key || '0', 10) - parseInt(b.key || '0', 10))
      .map((item) => resolveVariable(item.source || item.field || item.value, context));
  } else if (typeof variableMap === 'object' && variableMap !== null) {
    const keys = Object.keys(variableMap).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    params = keys.map((k) => resolveVariable(variableMap[k], context));
  }

  // Fallback defaults if no variables resolved
  if (params.length === 0) {
    params = [
      customerData.customerName || 'Valued Customer',
      customerData.orderNumber || '#Order',
      customerData.formattedTotal || '$0.00',
    ];
  }

  const components = [
    {
      type: 'body',
      parameters: params.map((text) => ({
        type: 'text',
        text: String(text || 'N/A'),
      })),
    },
  ];

  return {
    templateName,
    languageCode,
    components,
    parameters: params,
  };
}

/**
 * Constructs an interactive WhatsApp message payload with Quick Reply buttons
 * for COD Order Verification ("Confirm Order" and "Cancel Order"), supporting rule overrides.
 *
 * @param {Object} customerData - Standardized customer and order info
 * @param {Object} [rule] - Optional NotificationRule override
 * @returns {Object} Interactive message options
 */
export function buildCodInteractiveMessage(customerData, rule = null) {
  const orderRef = customerData.orderId || customerData.orderNumber?.replace('#', '') || 'order';
  const customerName = customerData.customerName || 'Valued Customer';
  const orderNumber = customerData.orderNumber || '#Order';
  const amount = customerData.formattedTotal || 'your order';

  const headerText = rule?.headerText || 'COD Order Verification';
  let bodyText =
    rule?.bodyText ||
    `Hi {{1}}, please verify your Cash on Delivery order {{2}} for {{3}}. Please click below to confirm or cancel your shipment:`;

  // Interpolate body text variables if placeholders exist
  bodyText = bodyText
    .replace(/\{\{1\}\}/g, customerName)
    .replace(/\{\{2\}\}/g, orderNumber)
    .replace(/\{\{3\}\}/g, amount);

  const footerText = rule?.footerText || 'WaNotify Verification';

  return {
    headerText,
    bodyText,
    footerText,
    buttons: [
      {
        id: `cod_confirm_${orderRef}`,
        title: '✅ Confirm Order',
      },
      {
        id: `cod_cancel_${orderRef}`,
        title: '❌ Cancel Order',
      },
    ],
  };
}

/**
 * Builds Meta WhatsApp Cloud API template components based on event topic (Backward compatibility)
 *
 * @param {Object} customerData - Extracted customer data
 * @param {string} [topic] - Webhook topic
 * @returns {{ templateName: string, components: Array }}
 */
export function buildTemplateMessage(customerData, topic = '') {
  const normTopic = String(topic).toLowerCase();

  let templateName = 'order_confirmation';

  if (normTopic.includes('abandon') || normTopic.includes('checkout')) {
    templateName = 'abandoned_cart_recovery';
  } else if (normTopic.includes('fulfill') || normTopic.includes('ship')) {
    templateName = 'order_shipped';
  }

  const components = [
    {
      type: 'body',
      parameters: [
        {
          type: 'text',
          text: customerData.customerName || 'Customer',
        },
        {
          type: 'text',
          text: customerData.orderNumber || 'Order',
        },
        {
          type: 'text',
          text: customerData.formattedTotal || '$0.00',
        },
      ],
    },
  ];

  return {
    templateName,
    components,
  };
}

export default {
  normalizePhoneNumber,
  extractCustomerData,
  isCodOrder,
  resolveVariable,
  getNotificationRule,
  buildDynamicTemplate,
  buildCodInteractiveMessage,
  buildTemplateMessage,
  DEFAULT_RULES,
};
