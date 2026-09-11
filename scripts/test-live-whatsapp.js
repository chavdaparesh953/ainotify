import config from '../src/config/env.js';
import { normalizePhoneNumber } from '../src/utils/templateMapper.js';
import { sendMessage, WhatsAppApiError } from '../src/services/whatsappService.js';

/**
 * Parses command line arguments into an options object
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    phone: process.env.TEST_RECIPIENT_PHONE || null,
    template: 'order_confirmation',
    customerName: 'Aarav Sharma',
    orderNumber: '#1001',
    orderTotal: 'USD 149.99',
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--template' || arg === '-t') {
      options.template = args[++i];
    } else if (arg === '--name' || arg === '-n') {
      options.customerName = args[++i];
    } else if (arg === '--order' || arg === '-o') {
      options.orderNumber = args[++i];
    } else if (arg === '--total') {
      options.orderTotal = args[++i];
    } else if (!arg.startsWith('-') && !options.phone) {
      options.phone = arg;
    }
  }

  return options;
}

function printUsage() {
  console.log(`
📱 WhatsApp Cloud API Live Connectivity Test Script
====================================================

Usage:
  node scripts/test-live-whatsapp.js <PHONE_NUMBER> [options]

Arguments:
  <PHONE_NUMBER>              Physical phone number with country code (e.g., +919876543210 or 15551234567)

Options:
  --template, -t <name>       Template name (default: "order_confirmation")
                              Use "hello_world" for Meta's default pre-approved test template.
  --name, -n <string>         Customer Name parameter (default: "Aarav Sharma")
  --order, -o <string>        Order Number parameter (default: "#1001")
  --total <string>            Order Total parameter (default: "USD 149.99")
  --help, -h                  Display this help information

Examples:
  # Test with default order_confirmation template:
  node scripts/test-live-whatsapp.js +919876543210

  # Test with Meta's instant pre-approved sandbox template (no custom template required):
  node scripts/test-live-whatsapp.js +919876543210 --template hello_world

  # Test with custom order details:
  node scripts/test-live-whatsapp.js +919876543210 --name "Priya Patel" --order "#5029" --total "INR 2499.00"
`);
}

async function runLiveTest() {
  const options = parseArgs();

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  console.log('===============================================================');
  console.log('🚀 Meta WhatsApp Cloud API - Live Physical Phone Connectivity');
  console.log('===============================================================\n');

  // 1. Inspect Environment Credentials
  const accessToken = config.meta.accessToken;
  const phoneNumberId = config.meta.phoneNumberId;
  const businessAccountId = config.meta.businessAccountId;
  const apiVersion = config.meta.apiVersion;

  console.log('📋 Current Meta Configuration:');
  console.log(`   - API Version        : ${apiVersion}`);
  console.log(`   - Phone Number ID    : ${phoneNumberId || '❌ NOT SET'}`);
  console.log(`   - Business Account ID: ${businessAccountId || '❌ NOT SET'}`);
  console.log(`   - Access Token       : ${accessToken ? `${accessToken.slice(0, 10)}...${accessToken.slice(-6)}` : '❌ NOT SET'}`);

  const isMockToken = !accessToken || accessToken.startsWith('mock_');
  const isMockPhone = !phoneNumberId || phoneNumberId.startsWith('mock_');

  if (isMockToken || isMockPhone) {
    console.log('\n⚠️  ACTION REQUIRED: Real Meta Credentials Missing in .env');
    console.log('---------------------------------------------------------------');
    console.log('Your .env file currently contains mock/placeholder Meta credentials:');
    if (isMockToken) console.log('   - META_ACCESS_TOKEN is missing or starts with "mock_"');
    if (isMockPhone) console.log('   - META_PHONE_NUMBER_ID is missing or starts with "mock_"');
    console.log('\nTo obtain your live credentials:');
    console.log('1. Go to https://developers.facebook.com/apps/ and select your App.');
    console.log('2. Navigate to WhatsApp -> API Setup.');
    console.log('3. Copy your "Phone number ID" into META_PHONE_NUMBER_ID in .env.');
    console.log('4. Copy your "Temporary access token" (or generate a System User permanent token) into META_ACCESS_TOKEN in .env.');
    console.log('5. If using a Test Number, add your recipient phone number to the "To" allowlist.');
    console.log('6. Re-run this script.\n');
    console.log('👉 See META_WHATSAPP_SETUP.md for complete step-by-step guidance.\n');
    process.exit(1);
  }

  // 2. Validate Recipient Phone Number
  if (!options.phone) {
    console.error('❌ Error: Recipient phone number is required.\n');
    printUsage();
    process.exit(1);
  }

  const normalizedPhone = normalizePhoneNumber(options.phone);
  if (!normalizedPhone) {
    console.error(`❌ Error: "${options.phone}" could not be parsed into a valid international phone number (E.164).`);
    console.error('   Please provide phone with country code, e.g.: +919876543210 or 15551234567\n');
    process.exit(1);
  }

  console.log(`\n🎯 Target Recipient:`);
  console.log(`   - Raw Input    : ${options.phone}`);
  console.log(`   - Normalized   : +${normalizedPhone} (${normalizedPhone})`);
  console.log(`   - Template     : ${options.template}`);

  // 3. Build Template Components
  let components = [];
  if (options.template === 'order_confirmation') {
    components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: options.customerName },
          { type: 'text', text: options.orderNumber },
          { type: 'text', text: options.orderTotal },
        ],
      },
    ];
    console.log(`   - Body Param 1 : {{1}} = "${options.customerName}"`);
    console.log(`   - Body Param 2 : {{2}} = "${options.orderNumber}"`);
    console.log(`   - Body Param 3 : {{3}} = "${options.orderTotal}"`);
  } else if (options.template === 'hello_world') {
    // Meta pre-approved template has no parameters
    components = [];
    console.log('   - Mode         : Meta Sandbox pre-approved template (zero parameters)');
  }

  // 4. Dispatch Live Request
  console.log(`\n📡 Sending live WhatsApp request to Meta Graph API...`);
  const startTime = Date.now();

  try {
    const result = await sendMessage({
      customerPhone: normalizedPhone,
      templateName: options.template,
      components,
      languageCode: 'en_US',
      timeoutMs: 15000,
    });

    const durationMs = Date.now() - startTime;

    console.log('\n===============================================================');
    console.log('🎉 LIVE WHATSAPP MESSAGE DISPATCHED SUCCESSFULLY!');
    console.log('===============================================================');
    console.log(`⏱️  Roundtrip Latency : ${durationMs}ms`);
    console.log(`📱 Recipient         : +${normalizedPhone}`);
    console.log(`🆔 Meta Message ID   : ${result.messageId}`);
    console.log(`📄 Template Used     : ${options.template}`);
    console.log('---------------------------------------------------------------');
    console.log('📦 Meta API Response:');
    console.log(JSON.stringify(result.rawResponse, null, 2));
    console.log('\n📲 Check your physical device now - the WhatsApp notification should arrive shortly!\n');
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('\n===============================================================');
    console.error(`❌ Meta WhatsApp API Dispatch Failed (${durationMs}ms)`);
    console.error('===============================================================');
    console.error(`Status Code  : ${error.statusCode || 'N/A'}`);
    console.error(`Error Code   : ${error.errorCode || 'N/A'}`);
    console.error(`Error Subcode: ${error.errorSubcode || 'N/A'}`);
    console.error(`Message      : ${error.message}\n`);

    if (error.details) {
      console.error('Details:');
      console.error(JSON.stringify(error.details, null, 2));
      console.error('');
    }

    // Diagnostic troubleshooting tips based on Meta error codes
    console.log('💡 Diagnostic Troubleshooting:');
    if (error.errorCode === 190) {
      console.log('   - Code 190: Access Token Expired or Invalid.');
      console.log('     Fix: In Meta Developer Console (WhatsApp -> API Setup), refresh your 24h temporary token');
      console.log('     or create a permanent System User Token in Meta Business Manager.');
    } else if (error.errorCode === 131030) {
      console.log('   - Code 131030: Recipient phone number not in Test Allowlist.');
      console.log('     Fix: In Meta Developer Console (WhatsApp -> API Setup), find the "To" field dropdown,');
      console.log('     click "Manage phone number list", and add your physical number to receive messages.');
    } else if (error.errorCode === 132000 || error.errorCode === 132001) {
      console.log(`   - Code ${error.errorCode}: Template "${options.template}" not found or not approved yet.`);
      console.log('     Fix: You can immediately test delivery with Meta\'s default sandbox template:');
      console.log(`          node scripts/test-live-whatsapp.js ${options.phone} --template hello_world`);
      console.log('     Or create and approve the "order_confirmation" template as described in META_WHATSAPP_SETUP.md');
    } else if (error.errorCode === 131026) {
      console.log('   - Code 131026: Receiver is incapable of receiving this message.');
      console.log('     Fix: Verify that this phone number is registered with an active WhatsApp account.');
    } else if (error.isRateLimit) {
      console.log('   - Code 4/429: Meta Rate Limit reached. Wait 60 seconds before retrying.');
    } else {
      console.log('   - Check that META_PHONE_NUMBER_ID in .env matches the Phone Number ID in your Meta Developer Portal.');
    }
    console.log('===============================================================\n');
    process.exit(1);
  }
}

runLiveTest();
