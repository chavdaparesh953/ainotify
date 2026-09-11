import assert from 'node:assert';
import { normalizePhoneNumber, extractCustomerData, buildTemplateMessage } from '../src/utils/templateMapper.js';
import { sendMessage, WhatsAppApiError } from '../src/services/whatsappService.js';
import { processWebhookJob } from '../src/workers/webhookWorker.js';
import prisma from '../src/db/prisma.js';

async function runWorkerTests() {
  console.log('🧪 Starting Step 3 Verification Test Suite (Worker & Meta API)...\n');

  // =========================================================================
  // Test Section 1: Phone Normalization (normalizePhoneNumber)
  // =========================================================================
  console.log('1️⃣ Testing Phone Number Standardization ...');
  {
    // US Format with plus, spaces, parentheses, hyphens
    const usPhone = normalizePhoneNumber('+1 (555) 234-5678', '1');
    assert.strictEqual(usPhone, '15552345678');

    // Number with international prefix '00'
    const prefixPhone = normalizePhoneNumber('0015552345678', '1');
    assert.strictEqual(prefixPhone, '15552345678');

    // 10-digit number should prepend default country code '1'
    const tenDigit = normalizePhoneNumber('5552345678', '1');
    assert.strictEqual(tenDigit, '15552345678');

    // 10-digit Indian number with default country code '91'
    const inPhone = normalizePhoneNumber('9876543210', '91');
    assert.strictEqual(inPhone, '919876543210');

    // Already valid E.164 without plus
    const cleanPhone = normalizePhoneNumber('447700900077');
    assert.strictEqual(cleanPhone, '447700900077');

    // Invalid / too short / null
    assert.strictEqual(normalizePhoneNumber('12345'), null);
    assert.strictEqual(normalizePhoneNumber(''), null);
    assert.strictEqual(normalizePhoneNumber(null), null);

    console.log('   ✅ Phone normalization handles all formatting variants and edge cases\n');
  }

  // =========================================================================
  // Test Section 2: Template Mapper Data Extraction
  // =========================================================================
  console.log('2️⃣ Testing E-Commerce Payload Data Extraction ...');
  {
    // Shopify Order Payload
    const shopifyPayload = {
      id: 82098291194,
      order_number: 1005,
      total_price: '149.50',
      currency: 'USD',
      shipping_address: {
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1 (555) 888-9999',
      },
    };

    const shopifyData = extractCustomerData(shopifyPayload, 'SHOPIFY');
    assert.strictEqual(shopifyData.customerName, 'John Doe');
    assert.strictEqual(shopifyData.normalizedPhone, '15558889999');
    assert.strictEqual(shopifyData.orderNumber, '#1005');
    assert.strictEqual(shopifyData.formattedTotal, 'USD 149.50');
    console.log('   ✅ Shopify order parsed accurately');

    // WooCommerce Order Payload
    const wooPayload = {
      id: 5042,
      total: '45.00',
      currency: 'GBP',
      billing: {
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+44 7700 900077',
      },
    };

    const wooData = extractCustomerData(wooPayload, 'WOOCOMMERCE');
    assert.strictEqual(wooData.customerName, 'Jane Smith');
    assert.strictEqual(wooData.normalizedPhone, '447700900077');
    assert.strictEqual(wooData.orderNumber, '#5042');
    assert.strictEqual(wooData.formattedTotal, 'GBP 45.00');
    console.log('   ✅ WooCommerce order parsed accurately\n');
  }

  // =========================================================================
  // Test Section 3: Template Component Builder
  // =========================================================================
  console.log('3️⃣ Testing WhatsApp Template Component Builder ...');
  {
    const customerData = {
      customerName: 'Alex Rivera',
      orderNumber: '#2048',
      formattedTotal: 'EUR 89.00',
    };

    const orderMsg = buildTemplateMessage(customerData, 'orders/create');
    assert.strictEqual(orderMsg.templateName, 'order_confirmation');
    assert.strictEqual(orderMsg.components[0].parameters[0].text, 'Alex Rivera');
    assert.strictEqual(orderMsg.components[0].parameters[1].text, '#2048');
    assert.strictEqual(orderMsg.components[0].parameters[2].text, 'EUR 89.00');

    const abandonMsg = buildTemplateMessage(customerData, 'checkouts/create');
    assert.strictEqual(abandonMsg.templateName, 'abandoned_cart_recovery');

    const shippedMsg = buildTemplateMessage(customerData, 'orders/fulfilled');
    assert.strictEqual(shippedMsg.templateName, 'order_shipped');

    console.log('   ✅ Template names and dynamic body parameters constructed correctly\n');
  }

  // =========================================================================
  // Test Section 4: Meta API Service (sendMessage)
  // =========================================================================
  console.log('4️⃣ Testing Meta WhatsApp Cloud API Service ...');
  {
    const originalFetch = globalThis.fetch;

    try {
      // 4a. Successful delivery mock
      globalThis.fetch = async (url, options) => {
        assert.ok(url.includes('graph.facebook.com'), 'Expected Meta graph endpoint URL');
        assert.ok(options.headers.Authorization.includes('Bearer'), 'Bearer token required');

        const body = JSON.parse(options.body);
        assert.strictEqual(body.messaging_product, 'whatsapp');
        assert.strictEqual(body.to, '15558889999');
        assert.strictEqual(body.template.name, 'order_confirmation');

        return {
          ok: true,
          status: 200,
          json: async () => ({
            messaging_product: 'whatsapp',
            contacts: [{ input: '15558889999', wa_id: '15558889999' }],
            messages: [{ id: 'wamid.HBgLMTU1NTg4ODk5OTkVAgARGBJGMkIz' }],
          }),
        };
      };

      const result = await sendMessage({
        customerPhone: '15558889999',
        templateName: 'order_confirmation',
        components: [],
        storeAccessToken: 'mock_test_token',
        phoneNumberId: '10987654321',
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.messageId, 'wamid.HBgLMTU1NTg4ODk5OTkVAgARGBJGMkIz');
      console.log('   ✅ Mock Meta API message dispatch successful (200 OK)');

      // 4b. Meta API Rate Limit Error (429)
      globalThis.fetch = async () => ({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'Too Many Requests',
            type: 'OAuthRateLimitException',
            code: 4,
          },
        }),
      });

      await assert.rejects(
        async () => {
          await sendMessage({
            customerPhone: '15558889999',
            templateName: 'order_confirmation',
            storeAccessToken: 'mock_test_token',
            phoneNumberId: '10987654321',
          });
        },
        (err) => {
          assert.strictEqual(err.isRateLimit, true);
          assert.strictEqual(err.statusCode, 429);
          return true;
        }
      );
      console.log('   ✅ Rate limit error identified (429 OAuthRateLimitException)');

      // 4c. Meta API Invalid Number Error (131026)
      globalThis.fetch = async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Receiver is incapable of receiving this message',
            type: 'OAuthException',
            code: 131026,
          },
        }),
      });

      await assert.rejects(
        async () => {
          await sendMessage({
            customerPhone: '15550000000',
            templateName: 'order_confirmation',
            storeAccessToken: 'mock_test_token',
            phoneNumberId: '10987654321',
          });
        },
        (err) => {
          assert.strictEqual(err.isInvalidNumber, true);
          return true;
        }
      );
      console.log('   ✅ Invalid recipient number error flagged (code 131026)\n');
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  // =========================================================================
  // Test Section 5: End-to-End Worker Job Processing & Prisma Logging
  // =========================================================================
  console.log('5️⃣ Testing Webhook Worker Processor & Prisma MessageLog Auditing ...');
  {
    const originalFetch = globalThis.fetch;
    const createdLogs = [];

    // Intercept Prisma MessageLog create
    prisma.messageLog.create = async ({ data }) => {
      const record = { id: `log_${Date.now()}_${createdLogs.length}`, ...data, createdAt: new Date() };
      createdLogs.push(record);
      return record;
    };

    // Intercept Prisma Store findUnique
    prisma.store.findUnique = async () => ({
      id: 'store_12345',
      platform: 'SHOPIFY',
      storeUrl: 'fashion-hub.myshopify.com',
      accessToken: 'shpat_store_specific_token',
    });

    try {
      // 5a. Process successful Shopify order job
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          messages: [{ id: 'wamid.HBgL_SUCCESS_JOB_1' }],
        }),
      });

      const successJob = {
        id: 'job_shopify_001',
        data: {
          storeId: 'store_12345',
          storeUrl: 'fashion-hub.myshopify.com',
          platform: 'SHOPIFY',
          topic: 'orders/create',
          payload: {
            id: 777001,
            order_number: 1088,
            total_price: '89.99',
            currency: 'USD',
            shipping_address: {
              first_name: 'Carlos',
              last_name: 'Santana',
              phone: '+1 (555) 345-6789',
            },
          },
        },
      };

      const jobResult = await processWebhookJob(successJob);
      assert.strictEqual(jobResult.success, true);
      assert.strictEqual(jobResult.messageId, 'wamid.HBgL_SUCCESS_JOB_1');

      const sentLog = createdLogs.find((l) => l.metadata.jobId === 'job_shopify_001');
      assert.ok(sentLog, 'Expected MessageLog record in Prisma');
      assert.strictEqual(sentLog.status, 'SENT');
      assert.strictEqual(sentLog.customerPhone, '15553456789');
      assert.strictEqual(sentLog.channel, 'WHATSAPP');
      assert.strictEqual(sentLog.metadata.orderNumber, '#1088');
      console.log('   ✅ Successful job processed and logged with status: SENT');

      // 5b. Process job with missing phone number
      const noPhoneJob = {
        id: 'job_shopify_002',
        data: {
          storeId: 'store_12345',
          storeUrl: 'fashion-hub.myshopify.com',
          platform: 'SHOPIFY',
          topic: 'orders/create',
          payload: {
            id: 777002,
            order_number: 1089,
            total_price: '29.99',
            customer: { first_name: 'No', last_name: 'Phone' },
          },
        },
      };

      const noPhoneResult = await processWebhookJob(noPhoneJob);
      assert.strictEqual(noPhoneResult.success, false);
      assert.strictEqual(noPhoneResult.reason, 'INVALID_OR_MISSING_PHONE');

      const failedLog = createdLogs.find((l) => l.metadata.jobId === 'job_shopify_002');
      assert.ok(failedLog, 'Expected failed MessageLog record in Prisma');
      assert.strictEqual(failedLog.status, 'FAILED');
      assert.strictEqual(failedLog.metadata.reason, 'INVALID_OR_MISSING_PHONE');
      console.log('   ✅ Missing phone job gracefully terminated and logged with status: FAILED');

      // 5c. Process job with Meta delivery error
      globalThis.fetch = async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Template not approved or does not exist',
            code: 100,
          },
        }),
      });

      const errorJob = {
        id: 'job_shopify_003',
        data: {
          storeId: 'store_12345',
          storeUrl: 'fashion-hub.myshopify.com',
          platform: 'SHOPIFY',
          topic: 'orders/create',
          payload: {
            id: 777003,
            order_number: 1090,
            total_price: '55.00',
            shipping_address: { phone: '+15559998888', first_name: 'Error' },
          },
        },
      };

      const errorResult = await processWebhookJob(errorJob);
      assert.strictEqual(errorResult.success, false);

      const apiFailLog = createdLogs.find((l) => l.metadata.jobId === 'job_shopify_003');
      assert.ok(apiFailLog);
      assert.strictEqual(apiFailLog.status, 'FAILED');
      assert.strictEqual(apiFailLog.customerPhone, '15559998888');
      assert.ok(apiFailLog.metadata.error.includes('Template not approved'));
      console.log('   ✅ Meta API failure logged to Prisma with status: FAILED\n');
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  console.log('🎉 ALL STEP 3 VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

runWorkerTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
