import React from 'react';
import { LegalLayout } from '../../components/LegalLayout.jsx';
import { Scale, CheckCircle, AlertTriangle, CreditCard, ShieldAlert, Ban, FileText } from 'lucide-react';

export function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The binding legal agreement governing your access and use of the WaNotify e-commerce WhatsApp and SMS automation platform."
      badge="Terms & Conditions"
      lastUpdated="October 2026"
      icon={Scale}
    >
      {/* Important Alert */}
      <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
        <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Meta WhatsApp Business Policy Compliance
        </h2>
        <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
          By using WaNotify, you strictly agree to abide by <strong>Meta's WhatsApp Business Messaging Policy and Commerce Policy</strong>. Sending unsolicited spam, unauthorized marketing broadcasts, or content violating local telecom laws is strictly forbidden and results in immediate account termination.
        </p>
      </div>

      {/* Section 1: Agreement to Terms */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-400" />
          1. Agreement to Terms
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          These Terms of Service ("Terms") constitute a legally binding agreement between you ("Merchant", "User", or "you") and WaNotify SaaS ("WaNotify", "we", "us"). By registering an account, connecting a Shopify or WooCommerce store, or utilizing our APIs, you accept and agree to be bound by these Terms.
        </p>
      </section>

      {/* Section 2: Permitted Use & Merchant Obligations */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-teal-400" />
          2. Permitted Use &amp; Merchant Consent Obligations
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          WaNotify provides transactional communication workflows including Cash on Delivery (COD) verification, order tracking alerts, and abandoned cart reminders. As a merchant:
        </p>
        <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside pl-2">
          <li><strong>Lawful Consent (Opt-in):</strong> You certify that all recipient telephone numbers processed through WaNotify were collected lawfully via your store's checkout with explicit consent to receive transactional notifications.</li>
          <li><strong>Immediate Opt-Out Honoring:</strong> If a customer requests to unsubscribe or opts out via WhatsApp reply ("STOP"), you agree not to re-target them with automated notifications.</li>
          <li><strong>Credential Security:</strong> You are responsible for keeping your account passwords and API tokens confidential.</li>
        </ul>
      </section>

      {/* Section 3: Prohibited Activities */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Ban className="w-5 h-5 text-rose-400" />
          3. Prohibited Activities
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          You may NOT use the WaNotify platform to:
        </p>
        <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside pl-2">
          <li>Send unsolicited mass spam, cold promotional blasts, or phishing messages.</li>
          <li>Promote prohibited goods under Meta Commerce Policy (e.g., weapons, narcotics, counterfeit items, unauthorized gambling).</li>
          <li>Attempt to reverse-engineer, exploit rate limits, or disrupt our message queue infrastructure.</li>
          <li>Impersonate another merchant, brand, or individual.</li>
        </ul>
      </section>

      {/* Section 4: Subscription, Billing & Renewals */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-teal-400" />
          4. Subscriptions, Fees &amp; Billing
        </h2>
        <div className="space-y-2.5 text-sm text-slate-300">
          <p>
            <strong>Subscription Billing:</strong> Paid plans are billed on a recurring monthly or annual basis via Stripe. Your subscription will automatically renew until canceled via your dashboard settings.
          </p>
          <p>
            <strong>Meta Conversation Fees:</strong> Note that Meta charges official WhatsApp conversation fees based on message category (Marketing vs Utility) directly to your WhatsApp Business Account. WaNotify platform plans cover software automation, webhooks, and workflow processing.
          </p>
          <p>
            <strong>Plan Limits:</strong> If your monthly store order volume exceeds your subscribed plan tier, you will be notified to upgrade to ensure uninterrupted delivery.
          </p>
        </div>
      </section>

      {/* Section 5: Service Availability & Disclaimers */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-teal-400" />
          5. Service Availability &amp; Third-Party Outages
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          While we strive for 99.9% platform uptime, message delivery ultimately relies on upstream third-party networks, including Meta Platforms Cloud API, telecom carriers, and e-commerce platforms (Shopify and WooCommerce). WaNotify is not liable for delayed or dropped messages resulting from third-party network outages or carrier filtering.
        </p>
      </section>

      {/* Section 6: Termination */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Ban className="w-5 h-5 text-teal-400" />
          6. Termination &amp; Suspension
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          You may terminate your account at any time by disconnecting your store and deleting your account. WaNotify reserves the right to suspend or terminate accounts immediately upon receiving spam complaints, Meta policy violation notices, or fraudulent chargebacks.
        </p>
      </section>

      {/* Section 7: Governing Law */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xl font-bold text-white">7. Governing Law &amp; Dispute Resolution</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          These Terms are governed by and construed in accordance with applicable laws. Any legal disputes shall be settled through binding arbitration or competent courts.
        </p>
        <p className="text-xs text-slate-400 pt-2">
          Questions regarding these Terms? Contact us at <a href="mailto:support@wanotify.com" className="text-teal-400 hover:underline">support@wanotify.com</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
export default TermsOfServicePage;
