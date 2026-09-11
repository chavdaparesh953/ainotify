import config from './config/env.js';
import prisma from './db/prisma.js';
import { createWebhookWorker } from './workers/webhookWorker.js';

console.log('====================================================');
console.log('⚙️  E-Commerce WhatsApp & SMS Worker Process Started');
console.log(`📡 Environment : ${config.env}`);
console.log(`📥 Queue Name  : ${config.queue.webhookQueueName}`);
console.log(`🔗 Redis Host  : ${config.redis.host}:${config.redis.port}`);
console.log('====================================================');

// Instantiate and start worker
const worker = createWebhookWorker();

// Graceful termination handler
async function handleShutdown(signal) {
  console.log(`\n[Worker Shutdown] Received ${signal}. Draining active jobs and shutting down...`);

  try {
    // 1. Close BullMQ worker (allows active jobs to finish processing)
    await worker.close();
    console.log('[Worker Shutdown] BullMQ worker closed.');

    // 2. Disconnect Prisma database client
    await prisma.$disconnect();
    console.log('[Worker Shutdown] Prisma client disconnected.');

    console.log('[Worker Shutdown] Shutdown complete. Exiting.');
    process.exit(0);
  } catch (err) {
    console.error('[Worker Shutdown Error]', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default worker;
