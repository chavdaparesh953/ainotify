import React from 'react';
import { LegalLayout } from '../../components/LegalLayout.jsx';
import { Shield, Lock, Eye, Database, Globe, UserCheck, RefreshCw, Mail } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How WaNotify collects, uses, and safeguards merchant credentials and end-customer order information in compliance with Meta WhatsApp Business policies, GDPR, and global data privacy standards."
      badge="Privacy & Data Protection"
      lastUpdated="October 2026"
      icon={Shield}
    >
      {/* Overview Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-200">
        <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-400" />
          Our Privacy Commitment
        </h2>
        <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
          WaNotify ("we", "us", or "our") provides e-commerce merchants with automated WhatsApp and SMS notification services for Shopify and WooCommerce. We treat your store credentials and your customers’ personal data with enterprise-grade security. <strong>We never sell, rent, monetize, or use your end-customers' data for advertising.</strong>
        </p>
      </div>

      {/* Section 1: Information We Collect */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Eye className="w-5 h-5 text-teal-400" />
          1. Information We Collect
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          To provide real-time order alerts and two-way verification, WaNotify processes two distinct types of data:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-1.5 text-teal-300">A. Merchant Account Data</h3>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Account profile details (Email, name, encrypted password hash).</li>
              <li>E-commerce store URL and platform credentials (Shopify Admin token / WooCommerce consumer secret).</li>
              <li>Meta WhatsApp Cloud API credentials (WABA ID, Phone Number ID, System User token).</li>
              <li>Billing customer ID (handled securely via Stripe; we do not store full credit card numbers).</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-1.5 text-teal-300">B. Customer Order &amp; Checkout Data</h3>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Customer telephone number (for WhatsApp/SMS transmission).</li>
              <li>Customer first name or billing name.</li>
              <li>Order details (Order ID, total amount, currency, items count, COD status).</li>
              <li>Abandoned checkout recovery links and timestamp.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2: How We Use Your Data */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-400" />
          2. How We Use Collected Data
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          We collect and process this data solely for the following business purposes:
        </p>
        <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside pl-2">
          <li><strong>Triggering Transactional WhatsApp Messages:</strong> Dispatching order confirmation, tracking updates, and abandoned checkout reminders via the official Meta Graph API.</li>
          <li><strong>Two-Way COD Order Write-Back:</strong> Receiving customer confirmation/cancellation responses via Meta Webhooks and updating the status in your Shopify or WooCommerce store.</li>
          <li><strong>Fraud Prevention &amp; RTO Reduction:</strong> Helping merchants identify unverified or invalid COD orders before dispatch.</li>
          <li><strong>Service Health &amp; Analytics:</strong> Providing merchants with aggregate delivery metrics (Sent, Delivered, Read, Clicked rates).</li>
        </ul>
      </section>

      {/* Section 3: Third-Party Service Providers */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-teal-400" />
          3. Third-Party Service Providers (Sub-Processors)
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          We share data strictly with trusted infrastructure providers required to operate our service:
        </p>
        <div className="space-y-2.5 text-xs text-slate-400">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3">
            <span className="font-semibold text-white min-w-[140px]">Meta Platforms, Inc.</span>
            <span>Processes WhatsApp messaging payloads via official Meta Cloud API servers. Adheres to Meta's Business Terms &amp; WhatsApp Privacy Policy.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3">
            <span className="font-semibold text-white min-w-[140px]">Stripe, Inc.</span>
            <span>Handles merchant subscription billing and invoices. PCI-DSS Level 1 compliant.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3">
            <span className="font-semibold text-white min-w-[140px]">Twilio &amp; Fast2SMS</span>
            <span>SMS gateway providers used as an optional failover channel for order verification.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3">
            <span className="font-semibold text-white min-w-[140px]">Cloud Infrastructure</span>
            <span>Hosted on encrypted servers with SSL/TLS 1.3 encryption in transit and AES-256 encryption at rest.</span>
          </div>
        </div>
      </section>

      {/* Section 4: Data Retention & Purging */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-teal-400" />
          4. Data Retention &amp; Automatic Purging
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          We retain message transmission logs (e.g. recipient phone number, status, timestamp) for a rolling window of <strong>30 to 90 days</strong> to allow merchants to audit delivery and analyze performance. After this retention window, raw logs are permanently anonymized or deleted from our primary databases.
        </p>
      </section>

      {/* Section 5: User Rights & Data Deletion */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-teal-400" />
          5. Your Privacy Rights &amp; Data Deletion
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Regardless of your jurisdiction, we respect your rights under GDPR, CCPA/CPRA, and India's DPDP Act:
        </p>
        <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside pl-2">
          <li><strong>Right to Access &amp; Portability:</strong> You may request an export of your store data and configuration at any time.</li>
          <li><strong>Right to Erasure (Right to be Forgotten):</strong> You can disconnect your store or delete your account anytime via Dashboard Settings. For complete data wipeout, review our dedicated <a href="/data-deletion" className="text-teal-400 underline hover:text-teal-300">User Data Deletion Instructions</a>.</li>
          <li><strong>Shopper Opt-Out:</strong> Shoppers receiving messages can reply with "STOP" or "UNSUBSCRIBE" at any time, immediately halting automated outreach.</li>
        </ul>
      </section>

      {/* Section 6: Contact Information */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-teal-400" />
          6. Contact Data Protection Officer
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          If you have questions regarding this Privacy Policy or wish to exercise your data subject rights, please contact our Data Protection Team:
        </p>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
          <p><strong>WaNotify Data Protection Office</strong></p>
          <p>Email: <a href="mailto:privacy@wanotify.com" className="text-teal-400 hover:underline">privacy@wanotify.com</a></p>
          <p>Support Inquiries: <a href="mailto:support@wanotify.com" className="text-teal-400 hover:underline">support@wanotify.com</a></p>
        </div>
      </section>
    </LegalLayout>
  );
}
export default PrivacyPolicyPage;
