# 1-Click Meta WhatsApp Embedded Signup Setup Guide

## Overview

Previously, connecting WhatsApp Cloud API required merchants to manually:
1. Create a Meta Developer App.
2. Navigate Meta Business Manager & create a System User.
3. Grant permissions & generate a token manually.
4. Copy-paste Phone Number ID, WABA ID, and a 200+ character access token.

With **1-Click WhatsApp Embedded Signup (Facebook Login for Business)**, store merchants now simply click:
👉 **"⚡ Connect WhatsApp with Facebook"**

Meta opens a native popup window where the merchant verifies their phone number with a 6-digit OTP. The backend automatically:
- Exchanges the authorization code for a **Long-Lived Meta Access Token**.
- Subscribes your SaaS App to the merchant's WhatsApp webhooks (`/v18.0/{waba_id}/subscribed_apps`).
- Discovers the verified Phone Number ID and WABA ID.
- Stores everything directly in the database (`User` and `Store` records).
- Displays a green "Connected" badge with active phone details.

---

## 1. Quick Local & Developer Setup

### Step 1: Add Credentials to `.env`

Open your root `.env` file and configure:

```env
# Meta WhatsApp Cloud API & Embedded Signup
META_API_VERSION=v18.0
META_APP_ID=your_facebook_app_id
META_APP_SECRET=your_facebook_app_secret
META_CONFIG_ID=your_embedded_signup_configuration_id  # (Optional, recommended)
```

> [!NOTE]
> If `META_APP_ID` is not yet configured, the dashboard automatically provides the **"Advanced / Developer Manual Configuration"** toggle so you can continue testing with sandbox credentials.

---

## 2. Setting Up Embedded Signup in Meta Developer Dashboard

To connect real Facebook users and WhatsApp numbers:

### Step 1: Open Your Meta Developer App
1. Navigate to **[Meta for Developers](https://developers.facebook.com/apps/)**.
2. Select your App (or Create a new App -> Choose **Business** type).

### Step 2: Add Products
In the left sidebar under **Add Product**:
1. Add **WhatsApp**.
2. Add **Facebook Login for Business**.

### Step 3: Create a Configuration for WhatsApp
1. Under **Facebook Login for Business**, click **Configurations** -> **Create Configuration**.
2. Name it (e.g. `WaNotify Embedded Signup`).
3. Under **Permissions**, select:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
4. Copy the generated **Configuration ID** and paste it into `.env` as `META_CONFIG_ID`.

### Step 4: Add Allowed Domains & Redirect URIs
Under **Facebook Login for Business** -> **Settings**:
- Add your app domains:
  - Local dev: `localhost`
  - Production: `wanotify-frontend.vercel.app` (or your production domain).

---

## 3. How the Implementation Works in the SaaS

### Frontend
- [facebookSdk.js](file:///Users/paresh/WhatsApp%20&%20SMS%20Automation%20SaaS%20for%20Shopify%20and%20WooCommerce./frontend/src/utils/facebookSdk.js): Dynamically loads Meta's `sdk.js` and launches `FB.login` with the official `whatsapp_embedded_signup` feature version 2.
- [WhatsAppSettingsCard.jsx](file:///Users/paresh/WhatsApp%20&%20SMS%20Automation%20SaaS%20for%20Shopify%20and%20WooCommerce./frontend/src/components/WhatsAppSettingsCard.jsx):
  - **1-Click Hero Card**: Prominent branded button to connect with Facebook.
  - **Connected State**: Displays phone details, masked token, and Disconnect/Switch options.
  - **Manual Accordion**: For developers needing sandbox/custom System User token bypass.
- [OnboardingPage.jsx](file:///Users/paresh/WhatsApp%20&%20SMS%20Automation%20SaaS%20for%20Shopify%20and%20WooCommerce./frontend/src/pages/OnboardingPage.jsx): Step 2 offers 1-Click WhatsApp connection directly during new merchant onboarding.

### Backend
- [settingsRoutes.js](file:///Users/paresh/WhatsApp%20&%20SMS%20Automation%20SaaS%20for%20Shopify%20and%20WooCommerce./src/routes/settingsRoutes.js):
  - `POST /api/settings/whatsapp/embedded-signup`: Receives auth code/token and persists credentials.
  - `POST /api/settings/whatsapp/disconnect`: Resets credentials cleanly.
- [settingsController.js](file:///Users/paresh/WhatsApp%20&%20SMS%20Automation%20SaaS%20for%20Shopify%20and%20WooCommerce./src/controllers/settingsController.js):
  - Handles token exchange, WABA webhook subscription, and multi-tenant persistence.
- [whatsappService.js](file:///Users/paresh/WhatsApp%20&%20SMS%20Automation%20SaaS%20for%20Shopify%20and%20WooCommerce./src/services/whatsappService.js):
  - `exchangeCodeForAccessToken()`
  - `exchangeForLongLivedToken()`
  - `getWabaPhoneNumbers()`
  - `subscribeWabaApp()`

---

## 4. Verification & Testing

You can run the automated verification test suite anytime:

```bash
npm run test:embedded-signup
```

This verifies:
1. `401 Unauthorized` access controls.
2. Payload validation (missing code/token).
3. Cross-merchant multi-tenant isolation (`403 Forbidden`).
4. End-to-end token persistence & database storage.
5. GET settings metadata exposure without token leakage.
6. Clean credential disconnection.
