#!/usr/bin/env node

/**
 * WaNotify SaaS - Automated Local Webhook Tunnel (Ngrok) Setup
 * 
 * Programmatically exposes the local backend server (default port 4000)
 * to the public internet via Ngrok, printing a color-coded terminal dashboard
 * with the exact Meta WhatsApp Webhook Callback URL and Verify Token.
 */

import http from 'node:http';
import ngrok from '@ngrok/ngrok';
import config from '../src/config/env.js';

// ANSI Color Helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  brightGreen: '\x1b[92m',
  cyan: '\x1b[36m',
  brightCyan: '\x1b[96m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  brightMagenta: '\x1b[95m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
  brightWhite: '\x1b[97m',
  red: '\x1b[31m',
  bgGreen: '\x1b[42m\x1b[30m\x1b[1m',
  bgCyan: '\x1b[46m\x1b[30m\x1b[1m',
  bgYellow: '\x1b[43m\x1b[30m\x1b[1m',
  bgBlue: '\x1b[44m\x1b[37m\x1b[1m',
};

/**
 * Check if the local backend server is running and healthy
 */
async function checkLocalBackend(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Render the color-coded terminal dashboard
 */
function renderDashboard({ tunnelUrl, port, isBackendAlive, verifyToken, authtokenProvided }) {
  const metaCallbackUrl = `${tunnelUrl}/api/webhooks/meta`;
  const shopifyWebhookUrl = `${tunnelUrl}/api/webhooks/receive`;
  const healthBadge = isBackendAlive
    ? `${c.brightGreen}● ONLINE (HTTP 200)${c.reset}`
    : `${c.yellow}▲ NOT DETECTED (Start server: npm run dev)${c.reset}`;

  console.clear();
  console.log(`
${c.cyan}╔════════════════════════════════════════════════════════════════════════════════════════╗${c.reset}
${c.cyan}║${c.reset}  ${c.bgCyan} WANOTIFY SAAS  ${c.reset}  ${c.bold}${c.brightWhite}Automated Local Webhook Tunnel (Ngrok)${c.reset}                     ${c.cyan}║${c.reset}
${c.cyan}╠════════════════════════════════════════════════════════════════════════════════════════╣${c.reset}
${c.cyan}║${c.reset}                                                                                        ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}  ${c.bold}Local Server Port:${c.reset}    ${c.white}http://localhost:${port}${c.reset} [${healthBadge}]
${c.cyan}║${c.reset}  ${c.bold}Public Tunnel:${c.reset}        ${c.brightGreen}${tunnelUrl}${c.reset}
${c.cyan}║${c.reset}  ${c.bold}Ngrok Auth Status:${c.reset}    ${authtokenProvided ? `${c.brightGreen}✓ Authenticated (NGROK_AUTHTOKEN)${c.reset}` : `${c.yellow}⚠ Unauthenticated / System Config${c.reset}`}
${c.cyan}║${c.reset}                                                                                        ${c.cyan}║${c.reset}
${c.cyan}╠════════════════════════════════════════════════════════════════════════════════════════╣${c.reset}
${c.cyan}║${c.reset}  ${c.bgGreen} META WHATSAPP WEBHOOK CREDENTIALS (COPY & PASTE) ${c.reset}                                    ${c.cyan}║${c.reset}
${c.cyan}╠════════════════════════════════════════════════════════════════════════════════════════╣${c.reset}
${c.cyan}║${c.reset}                                                                                        ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}  ${c.bold}${c.brightCyan}Callback URL:${c.reset}                                                                  ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}  ${c.bold}${c.brightWhite}${metaCallbackUrl}${c.reset}
${c.cyan}║${c.reset}                                                                                        ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}  ${c.bold}${c.brightCyan}Verify Token (META_WEBHOOK_VERIFY_TOKEN):${c.reset}                                             ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}  ${c.bold}${c.yellow}${verifyToken}${c.reset}
${c.cyan}║${c.reset}                                                                                        ${c.cyan}║${c.reset}
${c.cyan}╠════════════════════════════════════════════════════════════════════════════════════════╣${c.reset}
${c.cyan}║${c.reset}  ${c.bgBlue} SHOPIFY / WOOCOMMERCE WEBHOOK INGESTION URL ${c.reset}                                         ${c.cyan}║${c.reset}
${c.cyan}╠════════════════════════════════════════════════════════════════════════════════════════╣${c.reset}
${c.cyan}║${c.reset}  ${c.white}${shopifyWebhookUrl}${c.reset}
${c.cyan}║${c.reset}                                                                                        ${c.cyan}║${c.reset}
${c.cyan}╠════════════════════════════════════════════════════════════════════════════════════════╣${c.reset}
${c.cyan}║${c.reset}  ${c.bold}${c.brightMagenta}QUICK 3-STEP SETUP IN META DEVELOPER PORTAL:${c.reset}                                         ${c.cyan}║${c.reset}
${c.cyan}╠════════════════════════════════════════════════════════════════════════════════════════╣${c.reset}
${c.cyan}║${c.reset}                                                                                        ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}  ${c.bold}1.${c.reset} Go to ${c.brightWhite}Meta for Developers${c.reset} -> Select your App -> ${c.cyan}WhatsApp${c.reset} -> ${c.cyan}Configuration${c.reset}      ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}  ${c.bold}2.${c.reset} Click ${c.brightWhite}'Edit'${c.reset} on Webhook section:                                                ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}     • Paste ${c.brightCyan}Callback URL${c.reset} above                                                      ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}     • Paste ${c.yellow}Verify Token${c.reset} above                                                      ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}     • Click ${c.brightGreen}'Verify and Save'${c.reset} (Server will reply HTTP 200 with challenge)         ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}  ${c.bold}3.${c.reset} Under ${c.brightWhite}'Webhook fields'${c.reset}, click ${c.brightWhite}'Manage'${c.reset} -> ${c.brightGreen}Subscribe to 'messages'${c.reset}             ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}     (Required to receive inbound WhatsApp button clicks: COD Confirm / Cancel)         ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}                                                                                        ${c.cyan}║${c.reset}
${c.cyan}╚════════════════════════════════════════════════════════════════════════════════════════╝${c.reset}

  ${c.brightGreen}✔ Tunnel is active and routing requests to port ${port}.${c.reset}
  ${c.dim}Press ${c.bold}Ctrl+C${c.reset}${c.dim} at any time to terminate the tunnel.${c.reset}
`);
}

/**
 * Main execution
 */
async function startTunnel() {
  const port = config.port || 4000;
  const verifyToken = config.meta.webhookVerifyToken || 'omnipulse_meta_verify_token_123';
  const authtoken = config.ngrok?.authtoken || process.env.NGROK_AUTHTOKEN || '';
  const domain = config.ngrok?.domain || process.env.NGROK_DOMAIN || undefined;

  const isMock = process.argv.includes('--mock') || process.argv.includes('--dry-run') || process.env.MOCK_TUNNEL === 'true';

  console.log(`${c.cyan}⚡ Initializing WaNotify Webhook Tunnel on port ${port}...${c.reset}`);

  // Check local backend health
  const isBackendAlive = await checkLocalBackend(port);
  if (!isBackendAlive) {
    console.log(`${c.yellow}⚠ Warning: Local server not detected on port ${port}. Please ensure 'npm run dev' or 'npm start' is running.${c.reset}`);
  } else {
    console.log(`${c.green}✓ Local backend server detected on http://localhost:${port}/health${c.reset}`);
  }

  let listener = null;
  let tunnelUrl = '';

  if (isMock) {
    tunnelUrl = 'https://wanotify-demo.ngrok-free.app';
    renderDashboard({
      tunnelUrl,
      port,
      isBackendAlive,
      verifyToken,
      authtokenProvided: Boolean(authtoken),
    });

    if (process.argv.includes('--test-once')) {
      console.log(`${c.brightGreen}✓ Dry run verification completed successfully.${c.reset}`);
      process.exit(0);
    }
  } else {
    try {
      const forwardOptions = {
        addr: port,
      };

      if (authtoken) {
        forwardOptions.authtoken = authtoken;
      }
      if (domain) {
        forwardOptions.domain = domain;
      }

      listener = await ngrok.forward(forwardOptions);
      tunnelUrl = listener.url();

      renderDashboard({
        tunnelUrl,
        port,
        isBackendAlive,
        verifyToken,
        authtokenProvided: Boolean(authtoken),
      });
    } catch (err) {
      console.error(`\n${c.red}✖ Failed to start Ngrok tunnel:${c.reset}`, err.message || err);

      if (err.errorCode === 'ERR_NGROK_4018' || (err.message && err.message.includes('not authenticated'))) {
        console.log(`
${c.yellow}╔════════════════════════════════════════════════════════════════════════════════════════╗${c.reset}
${c.yellow}║${c.reset}  ${c.bgYellow} NGROK AUTHTOKEN REQUIRED ${c.reset}                                                           ${c.yellow}║${c.reset}
${c.yellow}╠════════════════════════════════════════════════════════════════════════════════════════╣${c.reset}
${c.yellow}║${c.reset}  Ngrok requires a free account and authtoken to start public sessions.                 ${c.yellow}║${c.reset}
${c.yellow}║${c.reset}                                                                                        ${c.yellow}║${c.reset}
${c.yellow}║${c.reset}  ${c.bold}1.${c.reset} Sign up or log in:  ${c.brightCyan}https://dashboard.ngrok.com/signup${c.reset}                             ${c.yellow}║${c.reset}
${c.yellow}║${c.reset}  ${c.bold}2.${c.reset} Copy your token:    ${c.brightCyan}https://dashboard.ngrok.com/get-started/your-authtoken${c.reset}         ${c.yellow}║${c.reset}
${c.yellow}║${c.reset}  ${c.bold}3.${c.reset} Add to your ${c.brightWhite}.env${c.reset} file:                                                        ${c.yellow}║${c.reset}
${c.yellow}║${c.reset}     ${c.brightGreen}NGROK_AUTHTOKEN=your_actual_token_here${c.reset}                                             ${c.yellow}║${c.reset}
${c.yellow}║${c.reset}                                                                                        ${c.yellow}║${c.reset}
${c.yellow}║${c.reset}  ${c.dim}Tip: Run with --mock flag to test console dashboard in development mode:${c.reset}            ${c.yellow}║${c.reset}
${c.yellow}║${c.reset}  ${c.cyan}npm run dev:tunnel -- --mock${c.reset}                                                        ${c.yellow}║${c.reset}
${c.yellow}╚════════════════════════════════════════════════════════════════════════════════════════╝${c.reset}
`);
      }
      process.exit(1);
    }
  }

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\n${c.yellow}Received ${signal}. Closing Ngrok tunnel...${c.reset}`);
    try {
      if (listener) {
        await listener.close();
      }
      console.log(`${c.green}✓ Ngrok tunnel closed cleanly.${c.reset}`);
    } catch (e) {
      // Ignore closing errors on shutdown
    }
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Keep event loop alive
  if (!process.argv.includes('--test-once')) {
    setInterval(() => {}, 1000 * 60 * 60);
  }
}

startTunnel().catch((err) => {
  console.error('Unexpected error in start-tunnel:', err);
  process.exit(1);
});
