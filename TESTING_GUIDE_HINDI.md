# 🧪 संपूर्ण QA और टेस्टिंग मास्टर गाइड (A to Z)
## WhatsApp & SMS Automation SaaS for Shopify & WooCommerce

> **लक्षित पाठक (Target Audience)**: QA इंजीनियर्स, टेस्टर्स, और फुल-स्टैक डेवलपर्स  
> **उद्देश्य (Scope)**: Meta WhatsApp Cloud API, SMS गेटवे (Twilio & Fast2SMS), Shopify & WooCommerce कनेक्शन, COD आर्डर टू-वे सिंक, बैकग्राउंड BullMQ वर्कर और मर्चेंट डैशबोर्ड का संपूर्ण एंड-टू-एंड टेस्टिंग।

---

## 📋 विषय-सूची (Table of Contents)
1. [लोकल टेस्टिंग शुरू करने की पूर्व-तैयारी (4-टर्मिनल सेटअप)](#1-लोकल-टेस्टिंग-शुरू-करने-की-पूर्व-तैयारी-4-टर्मिनल-सेटअप)
2. [मॉड्यूल 1: Meta WhatsApp Cloud API कनेक्शन और लाइव टेस्टिंग](#2-मॉड्यूल-1-meta-whatsapp-cloud-api-कनेक्शन-और-लाइव-टेस्टिंग)
   - [कहाँ जाना है और Meta पर क्या-क्या बनाना है](#कहाँ-जाना-है-और-meta-पर-क्या-क्या-बनाना-है)
   - [WhatsApp मैसेज टेम्पलेट्स कैसे बनाएं](#whatsapp-मैसेज-टेम्पलेट्स-कैसे-बनाएं)
   - [टर्मिनल से सीधा अपने मोबाइल पर लाइव मैसेज टेस्ट करें](#टर्मिनल-से-सीधा-अपने-मोबाइल-पर-लाइव-मैसेज-टेस्ट-करें)
   - [Meta इनबाउंड वेबहुक हैंडशेक और बटन रिप्लाई टेस्ट](#meta-इनबाउंड-वेबहुक-हैंडशेक-और-बटन-रिप्लाई-टेस्ट)
3. [मॉड्यूल 2: SMS कनेक्शन और ऑटोमैटिक फॉलबैक टेस्टिंग](#3-मॉड्यूल-2-sms-कनेक्शन-और-ऑटोमैटिक-फॉलबैक-टेस्टिंग)
   - [Twilio और Fast2SMS सेटअप](#twilio-और-fast2sms-सेटअप)
   - [बिना पैसे खर्च किए फ्री में मॉक टेस्टिंग (Mock Simulation)](#बिना-पैसे-खर्च-किए-फ्री-में-मॉक-टेस्टिंग-mock-simulation)
   - [WhatsApp-to-SMS फॉलबैक टेस्ट (जब कस्टमर WhatsApp पर न हो)](#whatsapp-to-sms-फॉलबैक-टेस्ट-जब-कस्टमर-whatsapp-पर-न-हो)
4. [मॉड्यूल 3: Shopify स्टोर कनेक्शन और ई-कॉमर्स ऑटोमेशन](#4-मॉड्यूल-3-shopify-स्टोर-कनेक्शन-और-ई-कॉमर्स-ऑटोमेशन)
   - [Shopify पार्टनर और Dev Store कैसे बनाएं](#shopify-पार्टनर-और-dev-store-कैसे-बनाएं)
   - [Shopify कस्टम ऐप और Admin Access Token (shpat_...)](#shopify-कस्टम-ऐप-और-admin-access-token-shpat_)
   - [SaaS डैशबोर्ड में स्टोर कनेक्ट करना](#saas-डैशबोर्ड-में-स्टोर-कनेक्ट-करना)
   - [बिना स्टोर के भी इंस्टेंट सिम्युलेटेड वेबहुक टेस्ट](#बिना-स्टोर-के-भी-इंस्टेंट-सिम्युलेटेड-वेबहुक-टेस्ट)
   - [COD टू-वे टैग सिंक टेस्ट (`COD-Confirmed` टैग Shopify पर लगना)](#cod-टू-वे-टैग-सिंक-टेस्ट-cod-confirmed-टैग-shopify-पर-लगना)
   - [एबंडन्ड कार्ट रिकवरी (Abandoned Checkout) और ऑर्गेनिक परचेस चेक](#एबंडन्ड-कार्ट-रिकवरी-abandoned-checkout-और-ऑर्गेनिक-परचेस-चेक)
5. [मॉड्यूल 4: WooCommerce स्टोर कनेक्शन और ऑटोमेशन](#5-मॉड्यूल-4-woocommerce-स्टोर-कनेक्शन-और-ऑटोमेशन)
   - [WooCommerce REST API Keys और वेबहुक जनरेट करना](#woocommerce-rest-api-keys-और-वेबहुक-जनरेट-करना)
   - [WooCommerce स्टोर SaaS से कनेक्ट करना](#woocommerce-स्टोर-saas-से-कनेक्ट-करना)
   - [आर्डर स्टेटस टू-वे सिंक टेस्ट (`processing` या `cancelled`)](#आर्डर-स्टेटस-टू-वे-सिंक-टेस्ट-processing-या-cancelled)
6. [मॉड्यूल 5: मर्चेंट फ्रंटेंड डैशबोर्ड UI टेस्टिंग](#6-मॉड्यूल-5-मर्चेंट-फ्रंटेंड-डैशबोर्ड-ui-टेस्टिंग)
7. [मॉड्यूल 6: सिक्योरिटी, HMAC सिग्नेचर और एज केस टेस्टिंग](#7-मॉड्यूल-6-सिक्योरिटी-hmac-सिग्नेचर-और-एज-केस-टेस्टिंग)
8. [मॉड्यूल 7: ऑटोमेटेड टेस्ट सूट्स (सभी 12 टेस्ट सूट्स)](#8-मॉड्यूल-7-ऑटोमेटेड-टेस्ट-सूट्स-सभी-12-टेस्ट-सूट्स)
9. [ट्रबलशूटिंग गाइड और सामान्य एरर कोड्स का समाधान](#9-ट्रबलशूटिंग-गाइड-और-सामान्य-एरर-कोड्स-का-समाधान)

---

## 1. लोकल टेस्टिंग शुरू करने की पूर्व-तैयारी (4-टर्मिनल सेटअप)

हमारा सिस्टम एक हाई-परफॉर्मेंस आर्किटेक्चर पर बना है जिसमें वेबहुक तुरंत रिसीव होकर Redis कतार (BullMQ) में जाता है और बैकग्राउंड वर्कर उसे प्रोसेस करता है।

### 🖥️ 4 अलग-अलग टर्मिनल्स में ये कमांड्स चलाएं:

| टर्मिनल | कमांड | क्या काम करता है | सफल आउटपुट कैसा दिखेगा |
| :--- | :--- | :--- | :--- |
| **Terminal 1** | `npm run dev` | Express कोर बैकएंड सर्वर (Port 4000) | `[Server] HTTP server listening on port 4000` |
| **Terminal 2** | `npm run worker` | बैकग्राउंड BullMQ वर्कर (मैसेज भेजने वाला) | `[Worker] BullMQ Worker listening on queue: ecommerce-webhooks` |
| **Terminal 3** | `npm run dev:tunnel` | ऑटोमैटिक Ngrok टनल (पब्लिक URL) | `https://xxxx.ngrok-free.app` और डैशबोर्ड दिखेगा |
| **Terminal 4** | `npm run frontend:dev` | मर्चेंट React डैशबोर्ड (Port 3000) | `Local: http://localhost:3000/` |

> [!IMPORTANT]
> कमांड्स चलाने से पहले सुनिश्चित करें कि **PostgreSQL** और **Redis** एक्टिव हों:
> - Redis चेक करें: `redis-cli ping` (उत्तर आना चाहिए: `PONG`)
> - डेटाबेस माइग्रेशन: `npm run prisma:migrate`

---

## 2. मॉड्यूल 1: Meta WhatsApp Cloud API कनेक्शन और लाइव टेस्टिंग

### कहाँ जाना है और Meta पर क्या-क्या बनाना है

1. **पोर्टल लिंक**: [Meta for Developers Console](https://developers.facebook.com/apps/) पर जाएं।
2. **ऐप बनाएं (Create App)**:
   - **Create App** बटन पर क्लिक करें।
   - **Other** चुनें ➜ **Business** टाइप चुनें।
   - ऐप का नाम रखें (जैसे: `OmniPulse Ecom Automation`) और ऐप बना लें।
3. **WhatsApp प्रोडक्ट जोड़ें**:
   - डैशबोर्ड में स्क्रॉल करें और **WhatsApp** के नीचे **Set Up** पर क्लिक करें।
4. **क्रेडेंशियल्स प्राप्त करें (API Setup)**:
   - बायीं तरफ मेनू में **WhatsApp** ➜ **API Setup** पर क्लिक करें।
   - **Phone number ID**: यह 15-16 अंकों का नंबर होता है (उदा. `104827592817293`), इसे कॉपी करें।
   - **WhatsApp Business Account ID**: यह WABA ID होती है (उदा. `103948572619482`), इसे कॉपी करें।
   - **Temporary access token**: यह `EAAG...` से शुरू होता है। (24 घंटे वैलिड रहता है, टेस्टिंग के लिए बेस्ट है)।
   - *परमानेंट टोकन के लिए*: [Meta Business Settings System Users](https://business.facebook.com/settings/system-users) में जाकर System User बनाकर Permanent Token निकाल सकते हैं।
5. **अपना मोबाइल नंबर अलाउलिस्ट (Sandbox) में जोड़ें**:
   - उसी **API Setup** पेज पर **To** ड्रॉपडाउन के पास **Manage phone number list** पर क्लिक करें।
   - अपना वास्तविक मोबाइल नंबर (+91 के साथ) दर्ज करें।
   - आपके फ़ोन पर WhatsApp पर 6 अंकों का OTP आएगा, उसे डालकर नंबर वेरीफाई करें।
6. **`.env` फाइल अपडेट करें**:
   ```env
   META_PHONE_NUMBER_ID="आपका_phone_number_id"
   META_ACCESS_TOKEN="आपका_meta_access_token"
   META_BUSINESS_ACCOUNT_ID="आपका_whatsapp_business_account_id"
   META_WEBHOOK_VERIFY_TOKEN="omnipulse_meta_verify_token_123"
   ```

---

### WhatsApp मैसेज टेम्पलेट्स कैसे बनाएं

WhatsApp Cloud API से कस्टमर को बिज़नेस इनिशिएटेड मैसेज भेजने के लिए प्री-अप्रूव्ड टेम्पलेट आवश्यक होता है।

#### 1. `order_confirmation` टेम्पलेट (Utility Category)
1. लिंक खोलें: [Meta WhatsApp Message Templates Manager](https://business.facebook.com/wa/manage/message-templates/)
2. **Create Template** पर क्लिक करें:
   - **Category**: `Utility` चुनें (इससे डिलीवरी रेट 99% रहता है और चार्ज कम लगता है)।
   - **Name**: `order_confirmation` (बिल्कुल यही नाम होना चाहिए, स्मॉल लेटर्स में)।
   - **Language**: `English (US)` (`en_US`) चुनें।
3. **Body (संदेश का मुख्य भाग)** में यह कॉपी-पेस्ट करें:
   ```text
   Hello {{1}}, thank you for your order! Your order {{2}} for {{3}} has been confirmed and is being prepared for shipment.
   ```
4. **Add sample** पर क्लिक करके सैंपल वैल्यूज भरें:
   - `{{1}}`: `Paresh Bhai` (कस्टमर का नाम)
   - `{{2}}`: `#1001` (आर्डर नंबर)
   - `{{3}}`: `₹1,499.00` (आर्डर अमाउंट)
5. **Submit for Review** पर क्लिक करें। Utility टेम्पलेट्स 1 से 5 मिनट में तुरंत अप्रूव हो जाते हैं।

#### 2. इंस्टेंट टेस्टिंग टेम्पलेट: `hello_world`
Meta हर टेस्ट अकाउंट में पहले से अप्रूव्ड `hello_world` टेम्पलेट देता है, जिसे आप बिना किसी अप्रूवल के तुरंत टेस्ट कर सकते हैं।

---

### टर्मिनल से सीधा अपने मोबाइल पर लाइव मैसेज टेस्ट करें

अब अपने टर्मिनल में यह कमांड चलाकर टेस्ट करें कि क्या आपके मोबाइल पर WhatsApp मैसेज आ रहा है:

```bash
# 1. Meta के डिफ़ॉल्ट hello_world टेम्पलेट से तुरंत टेस्ट करें:
node scripts/test-live-whatsapp.js +919876543210 --template hello_world

# 2. आर्डर कन्फर्मेशन टेम्पलेट से कस्टमर नाम, आर्डर नंबर और अमाउंट के साथ टेस्ट करें:
node scripts/test-live-whatsapp.js +919876543210 \
  --template order_confirmation \
  --name "Paresh" \
  --order "#ORD-555" \
  --total "₹2,999.00"
```

**सफल आउटपुट (Expected Output):**
```text
[WhatsAppService] Status Code: 200 OK
[WhatsAppService] Message ID: wamid.HBgL...
✅ WhatsApp test message successfully dispatched!
```
और आपके मोबाइल WhatsApp पर तुरंत मैसेज आ जाएगा!

---

### Meta इनबाउंड वेबहुक हैंडशेक और बटन रिप्लाई टेस्ट

जब कस्टमर WhatsApp पर **[Confirm Order]** या **[Cancel Order]** बटन दबाता है, तो Meta हमारे बैकएंड पर वेबहुक भेजता है।

#### स्टेप 1: Ngrok टनल और Meta में वेबहुक सेव करना
1. `npm run dev:tunnel` चलाएं और पब्लिक URL नोट करें (उदा. `https://abc.ngrok-free.app`)।
2. [Meta App Dashboard](https://developers.facebook.com/apps/) ➜ **WhatsApp** ➜ **Configuration** पर जाएं।
3. **Webhook** के नीचे **Edit** दबाएं:
   - **Callback URL**: `https://abc.ngrok-free.app/api/webhooks/meta`
   - **Verify Token**: `omnipulse_meta_verify_token_123`
   - **Verify and Save** दबाएं (हमारा सर्वर `hub.challenge` का उत्तर देकर तुरंत वेरीफाई कर देगा)।
4. **Webhook fields** में जाकर **`messages`** को **Subscribe** करें।

#### स्टेप 2: बटन क्लिक का cURL टेस्ट (सिम्युलेशन)
अगर आप बिना WhatsApp बटन दबाए लोकल सर्वर पर बटन क्लिक टेस्ट करना चाहते हैं:

```bash
curl -X POST http://localhost:4000/api/webhooks/meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "103948572619482",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "messages": [{
            "from": "919876543210",
            "id": "wamid.HBgL987654",
            "type": "interactive",
            "interactive": {
              "type": "button_reply",
              "button_reply": { "id": "cod_confirm_1024", "title": "Confirm Order" }
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

**रिजल्ट:** बैकएंड लॉग में दिखेगा:  
`[MetaWebhook] ✅ OrderVerification updated to "CONFIRMED" for Order 1024`  
डेटाबेस में स्टेटस `CONFIRMED` हो जाएगा!

---

## 3. मॉड्यूल 2: SMS कनेक्शन और ऑटोमैटिक फॉलबैक टेस्टिंग

हमारे SaaS में दो SMS गेटवे सपोर्टेड हैं:
1. **Twilio** (अंतर्राष्ट्रीय व ग्लोबल) - [Twilio Console](https://console.twilio.com/)
2. **Fast2SMS** (इंडिया DLT अप्रूव्ड) - [Fast2SMS Dev API](https://www.fast2sms.com/dashboard/dev-api)

### बिना पैसे खर्च किए फ्री में मॉक टेस्टिंग (Mock Simulation)
अगर आपके पास लाइव SMS बैलेंस नहीं है, तो हमारे कोड में **Built-in Mock Mode** है:
- Twilio `accountSid` में `mock_` या `AC_TEST_ACCOUNT_SID` डालें।
- Fast2SMS `apiKey` में `mock_` या `fast2sms_mock_api_key` डालें।

कमांड चलाकर टेस्ट करें:
```bash
npm run test:sms
```
यह टेस्ट स्वचालित रूप से:
- WhatsApp के बोल्ड/इटैलिक मार्कडाउन (`*bold*`, `_italic_`) को साफ प्लेन SMS में बदलता है।
- Twilio और Fast2SMS डिस्पैचर को टेस्ट करता है।
- फॉलबैक लॉजिक को वेरीफाई करता है।

---

### WhatsApp-to-SMS फॉलबैक टेस्ट (जब कस्टमर WhatsApp पर न हो)

**सीनारियो (Scenario)**: किसी कस्टमर ने स्टोर पर लैंडलाइन या ऐसा नंबर दिया जो WhatsApp पर नहीं है।
1. Meta API एरर कोड लौटाता है: `131026` (Not on WhatsApp / Undeliverable)।
2. हमारा वर्कर एरर 131026 को पहचानता है।
3. वर्कर चेक करता है: क्या स्टोर पर `fallbackToSms: true` सेट है?
4. यदि हाँ, तो वह तुरंत उसी मैसेज को SMS में कन्वर्ट करके Twilio या Fast2SMS से भेज देता है!
5. डेटाबेस के `message_logs` में स्टेटस **`SMS_FALLBACK`** और चैनल **`SMS`** रिकॉर्ड हो जाता है।

---

## 4. मॉड्यूल 3: Shopify स्टोर कनेक्शन और ई-कॉमर्स ऑटोमेशन

### Shopify पार्टनर और Dev Store कैसे बनाएं
1. [Shopify Partners Console](https://partners.shopify.com/) पर जाएं (फ्री अकाउंट बनता है)।
2. **Stores** ➜ **Add store** ➜ **Create development store** पर क्लिक करें।
3. स्टोर बनने के बाद Admin पैनल खोलें: `https://admin.shopify.com/store/<आपका_स्टोर>`.

### Shopify कस्टम ऐप और Admin Access Token (shpat_...)
1. स्टोर एडमिन में नीचे बायीं तरफ **Settings** ➜ **Apps and sales channels** पर क्लिक करें।
2. **Develop apps** ➜ **Create an app** (नाम रखें: `WaNotify Automation`)।
3. **Configuration** टैब में जाकर **Admin API integration** पर **Configure** दबाएं।
4. निम्नलिखित स्कोप्स (Scopes) चालू (Select) करें:
   - `read_orders` और `write_orders` (आर्डर पढ़ने और COD टैग लगाने के लिए)
   - `read_checkouts` और `write_checkouts` (एबंडन्ड कार्ट के लिए)
   - `read_customers`
5. **Save** दबाएं और ऊपर **Install app** पर क्लिक करें।
6. **Admin API access token** को Reveal करके कॉपी करें (यह `shpat_` से शुरू होता है)।

---

### SaaS डैशबोर्ड में स्टोर कनेक्ट करना
1. ब्राउज़र में मर्चेंट डैशबोर्ड खोलें: [http://localhost:3000/dashboard/stores](http://localhost:3000/dashboard/stores)
2. **+ Connect New Store** बटन दबाएं।
3. फॉर्म भरें:
   - **Platform**: `Shopify`
   - **Store URL**: `your-store-name.myshopify.com`
   - **Admin Access Token**: `shpat_xxxxxxxxxxxxxxxx`
   - **Webhook Secret**: कोई भी सीक्रेट स्ट्रिंग (उदा. `my_secret_key_123`)
4. **Connect Store** पर क्लिक करें। स्टोर डेटाबेस में सुरक्षित सेव हो जाएगा।

---

### बिना स्टोर के भी इंस्टेंट सिम्युलेटेड वेबहुक टेस्ट

आपको Shopify पर बार-बार डमी आर्डर प्लेस करने की जरूरत नहीं है। हमारे पास **क्रिप्टोग्राफिक HMAC-SHA256 सिम्युलेटर स्क्रिप्ट्स** मौजूद हैं:

```bash
# 1. सामान्य आर्डर सिम्युलेट करें (Order Confirmation WhatsApp जाएगा):
npm run simulate:webhook

# 2. अपने रियल फोन नंबर पर आर्डर वेबहुक सिम्युलेट करें:
node scripts/simulate-webhook.js +919876543210

# 3. कैश ऑन डिलीवरी (COD) आर्डर सिम्युलेट करें:
npm run simulate:cod

# 4. एबंडन्ड कार्ट (Abandoned Checkout) सिम्युलेट करें:
npm run simulate:abandoned
```

**स्क्रीन पर क्या दिखेगा:**
1. स्क्रिप्ट रियल Shopify पेलोड बनाती है।
2. सीक्रेट की से HMAC-SHA256 हैश कैलकुलेट करती है।
3. `http://localhost:4000/api/webhooks/receive` पर भेजती है।
4. सर्वर 15 मिलीसेकंड में **`200 OK Fast Acknowledgment`** देता है।
5. BullMQ वर्कर जॉब उठाता है और WhatsApp पर मैसेज भेज देता है!

---

### COD टू-वे टैग सिंक टेस्ट (`COD-Confirmed` टैग Shopify पर लगना)

1. जब आप `npm run simulate:cod` चलाते हैं, तो डेटाबेस में `OrderVerification` रिकॉर्ड `PENDING` स्टेटस में बनता है।
2. जब कस्टमर WhatsApp पर **Confirm Order** दबाता है (या आप cURL से भेजते हैं):
3. हमारा `ecommerceService.js` तुरंत Shopify Admin REST API को कॉल करता है:
   ```http
   PUT https://your-store.myshopify.com/admin/api/2024-01/orders/1024.json
   ```
4. **जाँच (Verification)**:
   - Shopify Admin ➜ Orders ➜ उस आर्डर को खोलें।
   - आर्डर के दाएँ तरफ **Tags** में **`COD-Confirmed`** टैग लग चुका होगा!
   - टाइमलाइन/नोट्स में लिखा होगा: `[WaNotify] Cash on Delivery verified via WhatsApp at ... UTC`

---

### एबंडन्ड कार्ट रिकवरी (Abandoned Checkout) और ऑर्गेनिक परचेस चेक

हमारा बैकग्राउंड वर्कर बहुत स्मार्ट है:
- यदि किसी कस्टमर ने चेकआउट अधूरा छोड़ा, तो वेबहुक आता है।
- लेकिन अगर कस्टमर ने रिकवरी मैसेज जाने से पहले ही स्टोर पर जाकर **ऑर्डर पूरा खरीद लिया**, तो हमारा वर्कर डेटाबेस चेक करके उसे **`RECOVERED_ORGANICALLY`** मार्क कर देता है और फालतू का मैसेज नहीं भेजता ताकि कस्टमर परेशान न हो।
- टेस्ट करने का कमांड:
  ```bash
  npm run test:abandoned
  ```

---

## 5. मॉड्यूल 4: WooCommerce स्टोर कनेक्शन और ऑटोमेशन

### WooCommerce REST API Keys और वेबहुक जनरेट करना
1. अपनी वर्डप्रेस साईट के एडमिन में जाएं (`wp-admin`)।
2. **WooCommerce** ➜ **Settings** ➜ **Advanced** ➜ **REST API** पर क्लिक करें।
3. **Add Key** पर क्लिक करें:
   - **Description**: `WaNotify SaaS`
   - **Permissions**: `Read/Write` चुनें।
4. **Generate API Key** दबाएं। आपको **Consumer Key** (`ck_...`) और **Consumer Secret** (`cs_...`) मिलेंगे।
5. SaaS में Access Token के रूप में इन्हें ऐसे जोड़कर लिखें: `ck_xxxx:cs_yyyy`

#### WooCommerce Webhook बनाना
1. **WooCommerce** ➜ **Settings** ➜ **Advanced** ➜ **Webhooks** पर क्लिक करें।
2. **Add Webhook**:
   - **Name**: `WaNotify Order Webhook`
   - **Status**: `Active`
   - **Topic**: `Order created`
   - **Delivery URL**: `https://<आपकी-ngrok-id>.ngrok-free.app/api/webhooks/receive`
   - **Secret**: एक सुरक्षित पासवर्ड (उदा. `wc_secret_999`)
3. **Save Webhook** दबाएं।

---

### आर्डर स्टेटस टू-वे सिंक टेस्ट (`processing` या `cancelled`)
जब WooCommerce का कस्टमर WhatsApp पर COD आर्डर कन्फर्म करता है:
1. हमारा SaaS WooCommerce REST API (`PUT /wp-json/wc/v3/orders/<id>`) को कॉल करता है।
2. आर्डर का स्टेटस अपने आप `on-hold` / `pending` से बदलकर **`processing`** हो जाता है।
3. आर्डर में प्राइवेट नोट जुड़ जाता है: `[WaNotify] Cash on Delivery verified via WhatsApp`.
4. यदि कस्टमर Cancel दबाता है, तो स्टेटस बदलकर **`cancelled`** हो जाता है।

ऑटोमेटेड टेस्ट चलाकर जांचें:
```bash
npm run test:ecommerce
```

---

## 6. मॉड्यूल 5: मर्चेंट फ्रंटेंड डैशबोर्ड UI टेस्टिंग

ब्राउज़र में खोलें: [http://localhost:3000](http://localhost:3000)

| पेज व URL | क्या-क्या टेस्ट करना है | पास होने की निशानी |
| :--- | :--- | :--- |
| **`/register` & `/login`** | नया मर्चेंट ईमेल रजिस्टर करें, गलत पासवर्ड डालकर एरर चेक करें, सही पासवर्ड से लॉगिन करें। | JWT टोकन `localStorage` में सेव होगा और डैशबोर्ड खुलेगा। |
| **`/dashboard` (Overview)** | टोटल मैसेज, डिलीवरी रेट %, फेल्ड काउंट के कार्ड्स देखें। "Copy Webhook URL" बटन दबाकर कॉपी करें। | कार्ड्स में रियल डेटा दिखेगा, कॉपी करने पर 'Copied!' का टोस्ट आएगा। |
| **`/dashboard/stores`** | कनेक्टेड स्टोर्स की लिस्ट देखें। "+ Connect New Store" पर क्लिक करके नया स्टोर जोड़ें। | पासवर्ड व सीक्रेट्स `***` में सुरक्षित (redacted) दिखेंगे। |
| **`/dashboard/automations`** | `ORDER_CREATED`, `COD_VERIFICATION`, `ABANDONED_CHECKOUT` को ऑन/ऑफ करके देखें। "Fallback to SMS" टॉगल करें। | पेज रीलोड करने पर भी सेटिंग्स सुरक्षित रहेंगी (Database Persisted)। |
| **`/dashboard/logs`** | कस्टमर फोन, डिलीवरी स्टेटस (`SENT`, `FAILED`, `PENDING`, `SMS_FALLBACK`) चेक करें। किसी भी रो पर क्लिक करें। | पूरा JSON मेटाडेटा मॉडल पॉपअप में खुलकर आ जाएगा। |
| **`/dashboard/settings`** | Meta WhatsApp क्रेडेंशियल्स और SMS क्रेडेंशियल्स अपडेट करके "Save" दबाएं। | सक्सेस टोस्ट नोटिफिकेशन दिखाई देगा। |
| **`/dashboard/billing`** | Free, Basic, Pro प्लान्स देखें। "Upgrade" पर क्लिक करें। | Stripe Checkout के सुरक्षित पेमेंट पेज पर रीडायरेक्ट होगा। |

---

## 7. मॉड्यूल 6: सिक्योरिटी, HMAC सिग्नेचर और एज केस टेस्टिंग

### टेस्ट 1: फर्जी या बदला हुआ वेबहुक (Tampered HMAC Signature)
यदि कोई हैकर बिना सही सीक्रेट की के फर्जी आर्डर का वेबहुक भेजे, तो सर्वर उसे तुरंत रिजेक्ट करना चाहिए:

```bash
curl -X POST http://localhost:4000/api/webhooks/receive \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: test-brand.myshopify.com" \
  -H "X-Shopify-Topic: orders/create" \
  -H "X-Shopify-Hmac-Sha256: FAKE_HACKED_SIGNATURE==" \
  -d '{"id":99999,"total_price":"999.00"}'
```

**अपेक्षित रिजल्ट (Expected):**
- HTTP स्टेटस: **`401 Unauthorized`**
- रिस्पांस: `{"success":false,"error":"Unauthorized","message":"Invalid webhook signature"}`

### टेस्ट 2: अनरजिस्टर्ड स्टोर डोमेन
यदि वेबहुक ऐसे डोमेन से आता है जो हमारे डेटाबेस में नहीं है:
- HTTP स्टेटस: **`404 Not Found`**
- रिस्पांस: `Store not registered in OmniPulse SaaS`.

### टेस्ट 3: गलत या अधूरा फोन नंबर
यदि आर्डर में कोई लैंडलाइन नंबर या अधूरा 4 अंकों का नंबर है:
- सर्वर या वर्कर क्रैश नहीं होगा।
- डेटाबेस के `message_logs` में आर्डर **`FAILED`** दर्ज होगा और रीज़न होगा **`INVALID_OR_MISSING_PHONE`**।

---

## 8. मॉड्यूल 7: ऑटोमेटेड टेस्ट सूट्स (सभी 12 टेस्ट सूट्स)

आप एक ही कमांड से प्रोजेक्ट के सभी 12 टेस्ट सूट्स एक साथ चला सकते हैं:

```bash
npm test
```

### अलग-अलग टेस्ट चलाने के शॉर्टकट कमांड्स:

| कमांड | टेस्ट का नाम | क्या टेस्ट करता है |
| :--- | :--- | :--- |
| `npm run test:webhook` | वेबहुक सिक्योरिटी | HMAC-SHA256 सिग्नेचर, टाइमिंग सेफ कम्पैरिजन, हेडर वैलिडेशन। |
| `npm run test:worker` | BullMQ वर्कर | कतार से जॉब उठाना, फोन नंबर नॉर्मलाइज़ेशन, टेम्पलेट मैपिंग। |
| `npm run test:cod` | COD वेरिफिकेशन | क्विक रिप्लाई बटन, इनबाउंड वेबहुक, डेटाबेस स्टेटस अपडेट। |
| `npm run test:ecommerce` | ई-कॉमर्स राइट-बैक | Shopify पर `COD-Confirmed` टैग और WooCommerce स्टेटस अपडेट। |
| `npm run test:automations` | ऑटोमेशन रूल्स | इवेंट्स ऑन/ऑफ टॉगल, वेरिएबल मैपिंग। |
| `npm run test:abandoned` | एबंडन्ड कार्ट | कार्ट रिकवरी और ऑर्गेनिक आर्डर प्रोटेक्शन चेक। |
| `npm run test:sms` | SMS और फॉलबैक | Twilio/Fast2SMS डिस्पैच और एरर 131026 फॉलबैक। |
| `npm run test:dashboard` | डैशबोर्ड API | स्टेटिस्टिक्स एग्रीगेशन, पेजिनेशन, डिलीवरी रेट %। |
| `npm run test:settings` | सेटिंग्स API | क्रेडेंशियल सेविंग और टोकन रिडेक्शन। |
| `npm run test:billing` | स्ट्राइप बिलिंग | प्लान अपग्रेड, सब्सक्रिप्शन स्टेटस। |
| `npm run test:shopify` | Shopify OAuth | OAuth फ्लो, स्टेट वेरिफिकेशन, टोकन एक्सचेंज। |
| `npm run test:onboarding` | मर्चेंट ऑनबोर्डिंग | स्टेप-बाय-स्टेप विज़ार्ड और स्टोर सेटअप। |

---

## 9. ट्रबलशूटिंग गाइड और सामान्य एरर कोड्स का समाधान

| एरर कोड / समस्या | मुख्य कारण | समाधान (Fix) |
| :--- | :--- | :--- |
| **Meta Error 190** | Access Token एक्सपायर हो गया है या गलत है। | Meta Developer Console ➜ API Setup से नया टोकन जनरेट करके `.env` में अपडेट करें या Permanent System User टोकन का उपयोग करें। |
| **Meta Error 131026** | नंबर WhatsApp पर रजिस्टर नहीं है या सैंडबॉक्स में अलाउ नहीं है। | सैंडबॉक्स में टेस्ट कर रहे हैं तो नंबर को 'Manage phone number list' में ऐड करें। लाइव में इसके लिए 'Fallback to SMS' ऑन रखें। |
| **Meta Error 131047** | 24-घंटे की कस्टमर सर्विस विंडो बंद हो चुकी है। | बिज़नेस को पहला मैसेज हमेशा Meta Pre-approved Template (`type: template`) से ही भेजना होगा। |
| **Meta Error 100** | टेम्पलेट का नाम मैच नहीं हो रहा। | चेक करें कि टेम्पलेट का नाम Meta Templates Manager में और कोड में हूबहू एक समान है (केस-सेंसिटिव) और भाषा `en_US` है। |
| **HTTP 401 Invalid Signature** | वेबहुक सीक्रेट मैच नहीं हो रहा। | सुनिश्चित करें कि Shopify/WooCommerce में जो सीक्रेट डाला है, वही SaaS डेटाबेस के स्टोर रिकॉर्ड में `webhookSecret` है। |
| **ECONNREFUSED 127.0.0.1:6379** | Redis सर्वर बंद है। | टर्मिनल में `redis-server` चलाएं या Mac पर `brew services start redis` चलाएं। |
| **Ngrok ERR_NGROK_3200** | टनल बंद हो गई है या एक्सपायर हो गई। | `npm run dev:tunnel` को दोबारा चलाएं और नया URL Meta व Shopify में अपडेट करें। |

---

*यह सम्पूर्ण गाइड OmniPulse WhatsApp & SMS SaaS के लिए विशेष रूप से बनाई गई है। बिना किसी कोड को डिलीट किए आप जब चाहें इसे रेफर कर सकते हैं।*
