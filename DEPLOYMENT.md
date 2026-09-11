# Production Deployment & Hosting Runbook

Comprehensive operational guide for deploying the **WhatsApp & SMS Automation SaaS for Shopify and WooCommerce** to serverless production infrastructure.

---

## 🏗️ Production Architecture Overview

```
                          ┌───────────────────────────┐
                          │   Merchant / Shopper      │
                          └─────────────┬─────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 │                                             │
                 ▼                                             ▼
     ┌───────────────────────┐                     ┌───────────────────────┐
     │    Vercel Frontend    │                     │  Shopify / WooCommerce│
     │   (React 18 + Vite)   │                     │  (Encrypted Webhook)  │
     └───────────┬───────────┘                     └───────────┬───────────┘
                 │ (REST API + Bearer JWT)                     │ (HMAC-SHA256)
                 ▼                                             ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                  Render Web Service: Express API Server                 │
   │      - Ingestion Gateway (POST /api/webhooks/receive)                   │
   │      - Merchant Authentication (POST /api/auth/login)                   │
   │      - Analytics & Store Dashboard (GET /api/dashboard/*)               │
   └─────────────┬─────────────────────────────────────────────┬─────────────┘
                 │                                             │
                 ▼ (Enqueue Payload)                           ▼ (User / Store Registry)
   ┌───────────────────────────┐                 ┌───────────────────────────┐
   │   Upstash Serverless      │                 │    Supabase Serverless    │
   │   Redis (BullMQ Queue)    │                 │    PostgreSQL (Prisma)    │
   └─────────────┬─────────────┘                 └─────────────┬─────────────┘
                 │                                             │
                 ▼ (Pull Job)                                  ▼ (Write MessageLog)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                 Render Background Worker: BullMQ Worker                 │
   │      - Normalizes International Phone Numbers (E.164)                   │
   │      - Generates Meta Template Components                               │
   │      - Transmits via Meta WhatsApp Cloud API v17.0                      │
   └─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Database Provisioning (Supabase PostgreSQL)

### 1.1 Create Supabase Project
1. Log in to [Supabase](https://supabase.com/).
2. Click **New Project**.
3. Choose an Organization, enter Project Name (e.g. `ecommerce-automation-saas`), and set a strong Database Password.
4. Select a region matching your Render services (e.g., **US West (Oregon)** or **EU Central (Frankfurt)**) to minimize network latency.
5. Click **Create new project** and wait ~2 minutes for provisioning.

### 1.2 Connection Pooling & `DATABASE_URL` Formatting
Because serverless APIs and queue workers open multiple concurrent database connections, you must use **Supabase Connection Pooling (PgBouncer)**:

1. Navigate to **Project Settings** → **Database**.
2. Scroll to the **Connection String** section and select the **URI** tab.
3. Switch Mode from *Session* to **Transaction** (Port `6543`).
4. Copy the connection string and append `?pgbouncer=true`:

```text
postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

> [!IMPORTANT]
> - Always replace `[YOUR-PASSWORD]` with your actual database password.
> - Ensure `?pgbouncer=true` is appended at the end so Prisma adjusts its connection handling for PgBouncer transaction pooling.

---

## Part 2: Cache & Queue Provisioning (Upstash Redis)

### 2.1 Create Upstash Redis Database
1. Log in to [Upstash Console](https://console.upstash.com/).
2. Click **Create Database**.
3. Enter Name: `ecommerce-saas-queue`.
4. Select Type: **Regional** (Low Latency).
5. Choose the **same region** as your Render and Supabase services (e.g., `us-west-1` Oregon).
6. Enable **TLS (SSL)** (Upstash enables TLS by default).
7. Click **Create**.

### 2.2 Extracting Redis Credentials
1. In the database dashboard, scroll down to the **Connect your database** section.
2. Select the **Node** or **ioredis** tab.
3. Copy the **`UPSTASH_REDIS_REST_URL`** or standard connection string:

```text
rediss://default:[YOUR-UPSTASH-PASSWORD]@[YOUR-ENDPOINT].upstash.io:6379
```

> [!NOTE]
> Note the `rediss://` scheme with double `s` — this indicates TLS encryption. Our `src/config/redis.js` automatically activates TLS validation when connecting to Upstash.

---

## Part 3: Backend Infrastructure Deployment (Render Blueprint)

We use Render's declarative **Infrastructure-as-Code Blueprint (`render.yaml`)** to deploy both the Express API and the BullMQ Background Worker from a single Git repository.

### 3.1 Deploying via Render Dashboard
1. Push your codebase to a GitHub or GitLab repository.
2. Open [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** in the top right and select **Blueprint**.
4. Connect your repository.
5. Render will automatically detect and parse [`render.yaml`](file:///Users/paresh/WhatsApp%20&%20SMS%20Automation%20SaaS%20for%20Shopify%20and%20WooCommerce./render.yaml).
6. In the Blueprint configuration preview, fill in the environment variables:
   - `DATABASE_URL`: Your Supabase Transaction Pooler connection string (`postgresql://...:6543/postgres?pgbouncer=true`).
   - `REDIS_URL`: Your Upstash Redis connection string (`rediss://default:...@...upstash.io:6379`).
   - `META_PHONE_NUMBER_ID`: Your Meta WhatsApp Business Phone Number ID.
   - `META_ACCESS_TOKEN`: Your Meta Permanent System User Access Token.
   - *(Note: `JWT_SECRET` is automatically generated by Render using a cryptographically secure 256-bit string).*
7. Click **Apply**.
8. Render will initiate parallel builds:
   - **`ecommerce-saas-api`** (Web Service): Runs build command `npm install && npx prisma generate && npx prisma migrate deploy` and boots `npm start`.
   - **`ecommerce-saas-worker`** (Background Worker): Boots `npm run worker`.

---

## Part 4: Production Database Migrations

### 4.1 Automated Migrations in CI/CD
Our `render.yaml` includes safe automated migration deployment during the web service build step:

```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

### 4.2 Why `prisma migrate deploy` instead of `prisma migrate dev`?
- **`prisma migrate dev`**: Designed **only for local development**. It inspects schema drift and may prompt to drop the database.
- **`prisma migrate deploy`**: Specifically built for **production CI/CD pipelines**. It applies any pending migrations in `prisma/migrations` in transactional sequence **without prompting** and **without risking data deletion**.

### 4.3 Manual Migration Commands (Emergency or Pre-Deployment)
If you need to deploy migrations manually from your terminal before spinning up services:

```bash
# 1. Export your live Supabase connection string
export DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# 2. Check current migration status against production
npx prisma migrate status

# 3. Safely execute pending migrations
npx prisma migrate deploy
```

---

## Part 5: Frontend Deployment (Vercel)

### 5.1 Deploying the React App on Vercel
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. In the **Project Configuration** screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`**.
   - **Build Command**: `npm run build` (detected automatically).
   - **Output Directory**: `dist` (detected automatically).
5. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your Render live Web Service URL (e.g. `https://ecommerce-saas-api.onrender.com`).
6. Click **Deploy**.

### 5.2 Single Page Application (SPA) Routing
Our project includes [`frontend/vercel.json`](file:///Users/paresh/WhatsApp%20&%20SMS%20Automation%20SaaS%20for%20Shopify%20and%20WooCommerce./frontend/vercel.json):
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This ensures direct URLs (e.g., `/dashboard/logs`, `/dashboard/stores`) correctly resolve to the React application on page refresh rather than returning a 404.

---

## Part 6: Connecting E-Commerce Webhooks in Production

Once your Render API is live:

### 6.1 Shopify Webhook Configuration
1. In Shopify Admin, navigate to **Settings** → **Notifications** → **Webhooks** (or via your Custom App).
2. Click **Create Webhook**.
3. **Event**: `Order creation` (`orders/create`).
4. **Format**: `JSON`.
5. **URL**: `https://ecommerce-saas-api.onrender.com/api/webhooks/receive`
6. **Webhook API Version**: `Latest` (e.g., `2024-01` or newer).
7. Copy the shared secret and add it via **Connect Store** in your OmniPulse Merchant Dashboard.

### 6.2 WooCommerce Webhook Configuration
1. In WordPress Admin, navigate to **WooCommerce** → **Settings** → **Advanced** → **Webhooks**.
2. Click **Add webhook**.
3. **Name**: `OmniPulse WhatsApp Automation`.
4. **Status**: `Active`.
5. **Topic**: `Order created`.
6. **Delivery URL**: `https://ecommerce-saas-api.onrender.com/api/webhooks/receive`
7. **Secret**: Enter a secure random string (copy this into your OmniPulse store settings).
8. **API Version**: `WP REST API Integration v3`.

---

## 7. Production Verification & Healthchecks

Test your deployed production endpoints:

```bash
# 1. Verify API Healthcheck
curl -i https://ecommerce-saas-api.onrender.com/health
# Expected: HTTP 200 OK {"status":"healthy","service":"ecommerce-whatsapp-sms-saas"}

# 2. Verify Webhook Security Rejection on Unsigned Request
curl -i -X POST https://ecommerce-saas-api.onrender.com/api/webhooks/receive \
  -H "Content-Type: application/json" \
  -d '{"ping":"pong"}'
# Expected: HTTP 400 Bad Request {"error":"Missing store identification"}
```
