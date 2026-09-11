# Meta WhatsApp Cloud API Setup & Real Phone Testing Guide

This guide details how to configure live Meta credentials, approve your e-commerce WhatsApp message templates, and test message delivery directly to physical mobile devices.

---

## 1. Obtain Your Live Meta Credentials

### Step 1: Open Your Meta Developer App
1. Go to **[Meta for Developers](https://developers.facebook.com/apps/)**.
2. Select your App (or click **Create App** -> Select **Other** -> Select **Business** -> Name your app).
3. Under **Add products to your app**, locate **WhatsApp** and click **Set up**.

---

### Step 2: Retrieve Phone Number ID & Business Account ID
1. In the left sidebar, navigate to **WhatsApp** -> **API Setup**.
2. Under **Step 1: Select phone numbers**:
   - **Phone number ID**: Copy the 15–16 digit number (e.g., `104827592817293`).
     👉 Set this as `META_PHONE_NUMBER_ID` in your `.env`.
   - **WhatsApp Business Account ID**: Copy the account ID (e.g., `103948572619482`).
     👉 Set this as `META_BUSINESS_ACCOUNT_ID` in your `.env`.

---

### Step 3: Choose Your Access Token Type

#### Option A: Temporary Access Token (Quick 24-Hour Testing)
- On the **API Setup** page, copy the **Temporary access token** (starts with `EAAG...`).
- Paste into `.env`:
  ```env
  META_ACCESS_TOKEN=EAAG...
  ```
> [!NOTE]
> Temporary tokens expire after 24 hours. Ideal for immediate testing.

#### Option B: Permanent System User Token (Recommended for Production / SaaS)
1. Go to **[Meta Business Manager](https://business.facebook.com/settings/)**.
2. Under **Users** -> **System Users**, click **Add** (Name: `SaaS Backend Worker`, Role: `Admin`).
3. Under **Assigned Assets**, assign your WhatsApp Business Account with **Full Control** (Manage WhatsApp Account).
4. Click **Generate New Token**:
   - Select your WhatsApp App.
   - Token expiration: **Never**.
   - Select the following permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
5. Copy the generated permanent token and paste into `.env`:
   ```env
   META_ACCESS_TOKEN=EAAG...
   ```

---

### Step 4: Add Recipient Phone Number to Sandbox Allowlist (Test Numbers Only)
If using Meta's free test phone number (e.g. `+1 555-078-xxxx`):
1. In **WhatsApp** -> **API Setup**, find the **To** phone number dropdown.
2. Click **Manage phone number list**.
3. Add your physical phone number (e.g. `+91 98765 43210` or `+1 555 123 4567`).
4. Meta will send a 6-digit verification code to your physical WhatsApp to authorize the number.

---

## 2. WhatsApp Template Setup (`order_confirmation`)

Our SaaS backend's [templateMapper.js](file:///Users/paresh/WhatsApp%20&%20SMS%20Automation%20SaaS%20for%20Shopify%20and%20WooCommerce./src/utils/templateMapper.js) requires the `order_confirmation` template to accept 3 dynamic body parameters:
- `{{1}}` -> **Customer Name** (e.g., `Aarav Sharma`)
- `{{2}}` -> **Order Number** (e.g., `#1001`)
- `{{3}}` -> **Order Total** (e.g., `USD 149.99` or `₹1,499.00`)

---

### Method 1: Create via Meta Business Manager UI (Recommended)

1. Open **[Meta WhatsApp Message Templates Manager](https://business.facebook.com/wa/manage/message-templates/)**.
2. Click **Create Template**.
3. Fill in the Template Details:
   - **Category**: `Utility` *(important: Utility templates enjoy higher delivery rates and lower fees)*.
   - **Name**: `order_confirmation` *(must match exactly)*.
   - **Language**: `English (US)` (`en_US`).
4. In the **Body** section, enter the following copy:
   ```text
   Hello {{1}}, thank you for your order! Your order {{2}} for {{3}} has been confirmed and is being prepared for shipment.
   ```
5. Click **Add sample** and provide sample values:
   - `{{1}}`: `Aarav Sharma`
   - `{{2}}`: `#1001`
   - `{{3}}`: `USD 149.99`
6. (Optional) In the **Footer** section, enter:
   ```text
   Thank you for shopping with us!
   ```
7. Click **Submit for Review**. Utility templates are typically approved automatically within 1 to 5 minutes.

---

### Method 2: Create Programmatically via Meta Graph API

Run this `curl` command in your terminal (replace `YOUR_WABA_ID` and `YOUR_META_ACCESS_TOKEN`):

```bash
curl -X POST "https://graph.facebook.com/v17.0/YOUR_WABA_ID/message_templates" \
  -H "Authorization: Bearer YOUR_META_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "order_confirmation",
    "category": "UTILITY",
    "language": "en_US",
    "components": [
      {
        "type": "BODY",
        "text": "Hello {{1}}, thank you for your order! Your order {{2}} for {{3}} has been confirmed and is being prepared for shipment.",
        "example": {
          "body_text": [
            [
              "Aarav Sharma",
              "#1001",
              "USD 149.99"
            ]
          ]
        }
      },
      {
        "type": "FOOTER",
        "text": "Thank you for shopping with us!"
      }
    ]
  }'
```

---

## 3. Instant Testing with `hello_world` Template

Meta provides a pre-approved template named `hello_world` for **every** developer account.
You can verify your token and phone number **immediately without waiting for template approval**:

```bash
node scripts/test-live-whatsapp.js +919876543210 --template hello_world
```

---

## 4. Live Physical Phone Verification Commands

Once your `.env` is populated with your real credentials:

### A. Direct API Connectivity Test (Bypasses Redis & Queue)
```bash
# Test using your approved order_confirmation template:
npm run test:whatsapp -- +919876543210

# Test with custom sample variables:
npm run test:whatsapp -- +919876543210 --name "Priya Patel" --order "#8492" --total "₹2,499.00"

# Test with Meta's instant pre-approved sandbox template:
npm run test:whatsapp -- +919876543210 --template hello_world
```

### B. Full Pipeline Test (Shopify Webhook -> Redis BullMQ -> Worker -> Live WhatsApp)
1. Ensure the background worker is running:
   ```bash
   npm run worker
   ```
2. Run the Shopify webhook simulator targeting your physical number:
   Edit the phone number in `scripts/simulate-webhook.js` (line 34) to your phone number, then run:
   ```bash
   npm run simulate:webhook
   ```
3. Watch the background worker process the job, trigger Meta's API, and write the live `SENT` log into PostgreSQL!
