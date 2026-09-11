import createApp from './app.js';
import config from './config/env.js';
import prisma from './db/prisma.js';
import { webhookQueue } from './queues/webhookQueue.js';
import { createWebhookWorker } from './workers/webhookWorker.js';

const app = createApp();

let worker = null;
if (process.env.DISABLE_EMBEDDED_WORKER !== 'true') {
  worker = createWebhookWorker();
}

const server = app.listen(config.port, () => {
  console.log('====================================================');
  console.log(`🚀 E-Commerce Automation Server running on port ${config.port}`);
  console.log(`📡 Environment : ${config.env}`);
  console.log(`🩺 Healthcheck : http://localhost:${config.port}/health`);
  console.log(`📬 Webhooks    : http://localhost:${config.port}/api/webhooks/receive`);
  if (worker) {
    console.log(`⚙️  BullMQ Worker: Active (listening on "${config.queue.webhookQueueName}")`);
  }
  console.log('====================================================');
});

// Graceful Shutdown Handler
async function gracefulShutdown(signal) {
  console.log(`\n[Shutdown] Received ${signal}. Starting graceful shutdown...`);

  // 1. Stop accepting new HTTP requests
  server.close(async () => {
    console.log('[Shutdown] HTTP server closed.');

    try {
      // Close worker if running embedded
      if (worker) {
        await worker.close();
        console.log('[Shutdown] BullMQ worker closed.');
      }

      // 2. Close BullMQ queue connections
      await webhookQueue.close();
      console.log('[Shutdown] BullMQ queue closed.');

      // 3. Disconnect Prisma database client
      await prisma.$disconnect();
      console.log('[Shutdown] Prisma client disconnected.');

      console.log('[Shutdown] Graceful shutdown completed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[Shutdown Error]', err);
      process.exit(1);
    }
  });

  // Force close if connections remain open after 10 seconds
  setTimeout(() => {
    console.error('[Shutdown] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server };
export default server;
