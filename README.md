# WhatsApp & SMS Automation SaaS for Shopify & WooCommerce

A high-performance, multi-tenant e-commerce automation SaaS backend built with **Node.js**, **Express.js**, **PostgreSQL** (via **Prisma ORM**), and **Redis** (via **BullMQ**).

---

## 1. Initialization & Setup Commands

To set up and run this project from scratch:

```bash
# 1. Initialize project and install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Generate Prisma Client
npm run prisma:generate

# 4. Run database migrations (when PostgreSQL is connected)
npm run prisma:migrate

# 5. Start the development server (with nodemon)
npm run dev

# 6. Start the background queue worker (in a separate terminal)
npm run worker
```

---

## 2. Tech Stack & Architecture

- **Runtime**: Node.js v20+ (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma Client v6
- **Queue & Async Processing**: BullMQ with Redis
- **Security**: Helmet, CORS, and raw-body buffer retention for HMAC signature verification

---

## 3. Database Relational Models (`prisma/schema.prisma`)

```prisma
enum Platform {
  SHOPIFY
  WOOCOMMERCE
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELED
}

enum MessageStatus {
  PENDING
  SENT
  FAILED
  READ
}

model User {
  id                 String             @id @default(uuid())
  email              String             @unique
  passwordHash       String
  subscriptionStatus SubscriptionStatus @default(TRIAL)
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  stores Store[]
}

model Store {
  id            String   @id @default(uuid())
  userId        String
  platform      Platform
  storeUrl      String   @unique
  accessToken   String
  webhookSecret String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  messageLogs MessageLog[]
}

model MessageLog {
  id            String        @id @default(uuid())
  storeId       String
  customerPhone String
  status        MessageStatus @default(PENDING)
  channel       String?       @default("WHATSAPP")
  metadata      Json?
  timestamp     DateTime      @default(now())
  createdAt     DateTime      @default(now())

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
}
```

---

## 4. API Endpoints

### 🩺 Healthcheck
```http
GET /health
```

---

### 🔐 Authentication (`/api/auth`)

#### Register Merchant
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "merchant@store.com",
  "password": "SecurePassword123!"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "u0000000-0000-0000-0000-000000000001",
    "email": "merchant@store.com",
    "subscriptionStatus": "TRIAL",
    "createdAt": "2026-09-09T15:00:00.000Z"
  }
}
```

#### Login Merchant
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "merchant@store.com",
  "password": "SecurePassword123!"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "u0000000-0000-0000-0000-000000000001",
    "email": "merchant@store.com",
    "subscriptionStatus": "TRIAL"
  }
}
```

#### Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <JWT_TOKEN>
```

---

### 📊 Merchant Dashboard (`/api/dashboard`) *(Protected by JWT)*

#### Aggregate Messaging Stats
```http
GET /api/dashboard/stats
Authorization: Bearer <JWT_TOKEN>
```
**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "totalMessages": 150,
    "sent": 142,
    "failed": 6,
    "pending": 2,
    "read": 0,
    "deliveryRate": "94.67%",
    "totalStores": 2
  }
}
```

#### Paginated Recent Message Logs
```http
GET /api/dashboard/recent-logs?page=1&limit=50&status=SENT
Authorization: Bearer <JWT_TOKEN>
```
**Response (200 OK):**
```json
{
  "success": true,
  "pagination": {
    "total": 142,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  },
  "logs": [
    {
      "id": "log_uuid",
      "storeId": "store_uuid",
      "customerPhone": "15551234567",
      "status": "SENT",
      "channel": "WHATSAPP",
      "metadata": {
        "jobId": "job_123",
        "messageId": "wamid.HBgL...",
        "orderNumber": "#1001",
        "formattedTotal": "USD 79.99"
      },
      "store": {
        "id": "store_uuid",
        "platform": "SHOPIFY",
        "storeUrl": "my-store.myshopify.com"
      },
      "createdAt": "2026-09-09T15:00:00.000Z"
    }
  ]
}
```

#### Connected Store Management
```http
GET /api/dashboard/stores
Authorization: Bearer <JWT_TOKEN>
```
**Response (200 OK):**
```json
{
  "success": true,
  "total": 2,
  "stores": [
    {
      "id": "store_uuid",
      "userId": "user_uuid",
      "platform": "SHOPIFY",
      "storeUrl": "my-store.myshopify.com",
      "hasWebhookSecret": true,
      "totalMessages": 120,
      "createdAt": "2026-09-09T15:00:00.000Z",
      "updatedAt": "2026-09-09T15:00:00.000Z"
    }
  ]
}
```
*(Sensitive tokens and secrets are strictly redacted)*

---

### 🏪 Store Onboarding & Connection
```http
POST /api/stores/connect
```

**Payload:**
```json
{
  "userId": "u0000000-0000-0000-0000-000000000001",
  "storeUrl": "https://my-store.myshopify.com/",
  "platform": "SHOPIFY",
  "accessToken": "shpat_live_merchant_token_xxx",
  "webhookSecret": "shpss_live_webhook_secret_yyy"
}
```


**Response (200 OK):**
```json
{
  "success": true,
  "message": "Store connected and configured successfully",
  "store": {
    "id": "a0000000-0000-0000-0000-000000000001",
    "userId": "u0000000-0000-0000-0000-000000000001",
    "platform": "SHOPIFY",
    "storeUrl": "my-store.myshopify.com",
    "hasWebhookSecret": true,
    "createdAt": "2026-09-09T15:00:00.000Z",
    "updatedAt": "2026-09-09T15:00:00.000Z"
  }
}
```
*Note: Tokens are saved encrypted/hashed in the database and never leaked in HTTP response bodies.*

---

### 📬 Cryptographically Secured Webhook Ingestion
```http
POST /api/webhooks/receive
```

Secured by `verifyWebhookSignature` middleware using timing-safe HMAC-SHA256 comparison against `req.rawBody`.

#### Shopify Webhook Example:
```bash
# Compute base64 HMAC-SHA256 of raw body with your store's webhookSecret
curl -X POST http://localhost:4000/api/webhooks/receive \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: my-store.myshopify.com" \
  -H "X-Shopify-Topic: orders/create" \
  -H "X-Shopify-Hmac-Sha256: <BASE64_HMAC_SHA256>" \
  -d '{
    "id": 82098291194,
    "email": "buyer@example.com",
    "total_price": "149.00",
    "shipping_address": {
      "phone": "+15551234567",
      "name": "Jane Doe"
    }
  }'
```

#### WooCommerce Webhook Example:
```bash
# Compute base64 HMAC-SHA256 of raw body with your WooCommerce webhook secret
curl -X POST http://localhost:4000/api/webhooks/receive \
  -H "Content-Type: application/json" \
  -H "X-WC-Webhook-Source: https://my-woocommerce-store.com/" \
  -H "X-WC-Webhook-Topic: order.created" \
  -H "X-WC-Webhook-Signature: <BASE64_HMAC_SHA256>" \
  -d '{
    "id": 1024,
    "status": "processing",
    "billing": {
      "phone": "+447700900077",
      "first_name": "John"
    }
  }'
```

#### Response (200 OK Fast Acknowledgment):
```json
{
  "success": true,
  "message": "Webhook received and queued for background processing",
  "jobId": "shopify_178920192_xyz",
  "storeId": "a0000000-0000-0000-0000-000000000001",
  "platform": "SHOPIFY",
  "topic": "orders/create",
  "ingestTimeMs": 14
}
```

---

## 5. Background Worker & Meta WhatsApp Integration (Step 3)

### ⚙️ Standalone Worker Architecture (`src/worker.js`)
The background worker runs independently of the HTTP web server:

```bash
# Start standalone queue worker
npm run worker
```

**Worker Execution Lifecycle:**
1. **BullMQ Worker** pulls queued jobs from `ecommerce-webhooks`.
2. **Template Mapping Engine (`src/utils/templateMapper.js`)**:
   - Parses E-commerce payloads (Shopify / WooCommerce).
   - Standardizes customer phone numbers to international digits-only format (`normalizePhoneNumber`).
   - Generates dynamic Meta template parameters.
3. **Meta WhatsApp Cloud API Service (`src/services/whatsappService.js`)**:
   - Posts template payload to `https://graph.facebook.com/v17.0/{phoneNumberId}/messages`.
   - Handles rate limits (429), undeliverable numbers (131026), and authentication.
4. **Prisma Audit Logging**:
   - Saves record into `prisma.messageLog`:
     - Successful dispatch: `status: SENT`, `metadata: { jobId, messageId, ... }`
     - Failure / missing phone: `status: FAILED`, `metadata: { error, reason, ... }`

---

## 6. Automated Verification Test Suites

Run all tests:
```bash
npm test
```

Or run individual suites:
```bash
# Webhook security & store onboarding tests (9 tests)
npm run test:webhook

# Background worker, Meta API & template mapping tests (5 suites)
npm run test:worker

# Merchant auth & dashboard API tests (6 suites)
npm run test:dashboard
```

---

## 7. Merchant Dashboard Frontend UI (Step 5)

Built with **React.js**, **Vite**, **Tailwind CSS**, **Lucide React**, and **React Router DOM v6**.

### 🚀 Frontend Setup & Run Commands

```bash
# Option 1: Run directly from project root
npm run frontend:dev

# Option 2: Navigate to frontend folder
cd frontend
npm install
npm run dev
# Dashboard launches at http://localhost:3000
```

### 📱 Pages & Features

1. **Authentication (`/login` & `/register`)**:
   - High-converting forms with real-time feedback, password validation, and JWT persistence in `localStorage`.
2. **Dashboard Layout (`DashboardLayout`)**:
   - Collapsible responsive Sidebar with active states, Top Navbar with merchant profile, subscription tier, and logout.
3. **Overview Analytics (`/dashboard`)**:
   - Real-time visual KPI cards (Total Messages, Delivery Rate, Failed Messages, Connected Stores).
   - Universal Webhook Ingestion endpoint box with one-click copy.
   - Interactive pipeline architecture diagram.
4. **Stores Management (`/dashboard/stores`)**:
   - Grid of connected Shopify and WooCommerce storefronts.
   - "Connect New Store" modal to link new domains and API secrets.
5. **Message Logs Table (`/dashboard/logs`)**:
   - Interactive data table showing Customer Phone, Delivery Status badges (`SENT` in emerald, `FAILED` in red, `PENDING` in amber), Channel, and Timestamp.
   - Previous/Next pagination and status filtering (`ALL`, `SENT`, `FAILED`, `PENDING`).
   - Audit detail modal displaying full metadata JSON payload.
6. **Account & Settings (`/dashboard/settings`)**:
   - Merchant account details, subscription tier, and Meta WhatsApp Cloud API credentials guide.



