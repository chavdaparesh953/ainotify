import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  redis: {
    url: process.env.REDIS_URL || '',
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true',
  },
  queue: {
    webhookQueueName: process.env.WEBHOOK_QUEUE_NAME || 'ecommerce-webhooks',
  },
  meta: {
    apiVersion: process.env.META_API_VERSION || 'v17.0',
    phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
    accessToken: process.env.META_ACCESS_TOKEN || '',
    businessAccountId: process.env.META_BUSINESS_ACCOUNT_ID || '',
    defaultCountryCode: process.env.DEFAULT_COUNTRY_CODE || '1',
    webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'omnipulse_meta_verify_token_123',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    priceBasic: process.env.STRIPE_PRICE_BASIC || '',
    pricePro: process.env.STRIPE_PRICE_PRO || '',
  },
  ngrok: {
    authtoken: process.env.NGROK_AUTHTOKEN || '',
    domain: process.env.NGROK_DOMAIN || undefined,
  },
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY || 'mock_shopify_api_key',
    apiSecret: process.env.SHOPIFY_API_SECRET || 'mock_shopify_api_secret',
    scopes: process.env.SHOPIFY_SCOPES || 'read_orders,write_orders,read_checkouts,write_checkouts',
    redirectUri: process.env.SHOPIFY_REDIRECT_URI || '',
  },
  appUrl: process.env.APP_URL || 'http://localhost:3000',
};

export default config;
