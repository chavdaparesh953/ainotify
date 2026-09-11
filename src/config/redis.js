import config from './env.js';

/**
 * Builds Redis connection options for BullMQ & IORedis
 * Supports both standalone host/port and serverless providers like Upstash.
 * Note: BullMQ requires maxRetriesPerRequest to be null
 */
function buildRedisOptions() {
  const retryStrategy = (times) => Math.min(times * 100, 3000);

  // If REDIS_URL is provided (e.g. rediss://default:xxx@endpoint.upstash.io:6379)
  if (config.redis.url) {
    try {
      const parsedUrl = new URL(config.redis.url);
      const isSecure =
        parsedUrl.protocol === 'rediss:' ||
        parsedUrl.hostname.includes('upstash.io') ||
        config.redis.tls;

      return {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port || '6379', 10),
        username: parsedUrl.username || undefined,
        password: parsedUrl.password || undefined,
        tls: isSecure ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy,
      };
    } catch {
      // Fallback if URL parsing fails
    }
  }

  // Host / Port / Password configuration
  const isUpstash =
    (config.redis.host && config.redis.host.includes('upstash.io')) ||
    config.redis.tls;

  return {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    tls: isUpstash ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy,
  };
}

export const redisConnection = buildRedisOptions();

export default redisConnection;

