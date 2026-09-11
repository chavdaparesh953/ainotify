import { Queue } from 'bullmq';
import config from '../config/env.js';
import redisConnection from '../config/redis.js';

/**
 * Initialize BullMQ Queue for Incoming E-commerce Webhooks
 * Configured with retry backoff and retention limits.
 */
export const webhookQueue = new Queue(config.queue.webhookQueueName, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s...
    },
    removeOnComplete: {
      count: 10000, // Keep last 10,000 completed jobs
      age: 24 * 3600, // Retain for 24 hours
    },
    removeOnFail: {
      count: 5000,
      age: 48 * 3600, // Retain failed jobs for 48 hours for debugging/dead-letter inspection
    },
  },
});

// Queue event logging
webhookQueue.on('error', (err) => {
  console.error(`[BullMQ] Queue "${config.queue.webhookQueueName}" error:`, err.message);
});

/**
 * Helper to dispatch webhook payload into the background queue
 * @param {Object} params
 * @param {string} params.storeId - Store UUID
 * @param {string} params.storeUrl - Store URL or domain
 * @param {string} params.platform - SHOPIFY or WOOCOMMERCE
 * @param {string} [params.topic] - e.g. orders/create, order.created
 * @param {Object} [params.options] - Optional BullMQ job options (e.g., delay)
 * @returns {Promise<import('bullmq').Job>}
 */
export async function enqueueWebhookJob({ storeId, storeUrl, platform, topic, payload, headers, options = {} }) {
  const jobData = {
    storeId,
    storeUrl,
    platform,
    topic: topic || 'unknown',
    payload,
    headers,
    receivedAt: new Date().toISOString(),
  };

  const job = await webhookQueue.add('process-webhook', jobData, {
    // Optional job ID deduplication or custom tags
    jobId: `${platform.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    ...options,
  });

  return job;
}

export default webhookQueue;
