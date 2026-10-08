import React from 'react';
import { LegalLayout } from '../../components/LegalLayout.jsx';
import { Trash2, ShieldCheck, Mail, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export function DataDeletionPage() {
  return (
    <LegalLayout
      title="User Data Deletion Instructions"
      subtitle="Step-by-step instructions for merchants and end-customers to request permanent deletion of their data in compliance with Meta Developer Policies and GDPR / CCPA regulations."
      badge="Data Deletion & Erasure"
      lastUpdated="October 2026"
      icon={Trash2}
    >
      {/* Notice Card for Meta Reviewers */}
      <div className="p-5 sm:p-6 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-200">
        <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          Meta &amp; Shopify Compliance Statement
        </h2>
        <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
          In adherence to <strong>Meta Platforms Platform Terms</strong> and <strong>Shopify Mandatory Privacy Webhook Standards</strong>, WaNotify provides transparent, automated, and self-service mechanisms for any user or consumer to request complete deletion of their stored data.
        </p>
      </div>

      {/* Section 1: For Merchants */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-teal-400" />
          1. How Merchants Can Request Complete Account &amp; Store Deletion
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          If you are a store merchant using WaNotify on Shopify or WooCommerce, you have two simple ways to completely purge your account, credentials, and message records:
        </p>

        {/* Method A: Self-Service */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 text-xs flex items-center justify-center font-bold">A</span>
              Self-Service Deletion via Merchant Dashboard (Instant)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Fastest</span>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 pl-1">
            <li>Log in to your WaNotify dashboard at <a href="/login" className="text-teal-400 underline">wanotify.com/login</a>.</li>
            <li>Navigate to <strong>Dashboard &rarr; Stores</strong> and click <strong>Disconnect Store</strong>. This immediately tears down webhook hooks in Shopify/WooCommerce.</li>
            <li>Go to <strong>Settings &rarr; Account</strong> and select <strong>Delete Account &amp; Purge All Data</strong>.</li>
            <li>Confirm the prompt. Your API tokens, store webhooks, automation workflows, and message history will be marked for permanent destruction.</li>
          </ol>
        </div>

        {/* Method B: Email Request */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-bold">B</span>
            Manual Email Request to our Data Protection Officer
          </h3>
          <p className="text-xs text-slate-300">
            If you no longer have access to your dashboard, send an email to <a href="mailto:privacy@wanotify.com" className="text-teal-400 hover:underline">privacy@wanotify.com</a> from your registered email address with the subject:
          </p>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-teal-300 select-all">
            Subject: Data Deletion Request - [Your Store Domain or Email]
          </div>
          <p className="text-[11px] text-slate-400">
            Our team will authenticate your ownership and process the deletion within <strong>48 hours</strong>.
          </p>
        </div>
      </section>

      {/* Section 2: For End-Customers (Shoppers) */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-400" />
          2. How End-Customers (Shoppers) Can Delete Their Notification Data
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          If you are a shopper who received a WhatsApp or SMS notification from a merchant using WaNotify:
        </p>
        <ul className="space-y-2.5 text-sm text-slate-300 list-disc list-inside pl-2">
          <li><strong>Instant WhatsApp Opt-Out:</strong> Simply reply <strong>"STOP"</strong> or <strong>"UNSUBSCRIBE"</strong> directly in the WhatsApp chat. Our webhook will automatically flag your phone number as opted-out, preventing any future messages.</li>
          <li><strong>Phone Number Purge Request:</strong> Email <a href="mailto:privacy@wanotify.com" className="text-teal-400 hover:underline">privacy@wanotify.com</a> with your phone number (including country code). We will erase all historical message logs associated with your number across our databases within 7 days.</li>
        </ul>
      </section>

      {/* Section 3: What Gets Deleted */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-400" />
          3. What Data Is Permanently Deleted
        </h2>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300 space-y-2">
          <p>Upon receiving a validated deletion request, we execute a permanent wipeout of:</p>
          <ul className="space-y-1 list-disc list-inside pl-2 text-slate-400">
            <li>Stored e-commerce API keys, Shopify admin tokens, and WooCommerce secrets.</li>
            <li>Meta WhatsApp Cloud API credentials (Phone Number ID, WABA ID, and System Token).</li>
            <li>All recipient phone numbers, order IDs, abandoned cart payload links, and customer names.</li>
            <li>All historical delivery logs, analytics event timestamps, and automated webhook subscriptions.</li>
          </ul>
        </div>
      </section>

      {/* Section 4: Deletion SLA & Confirmation */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-teal-400" />
          4. Deletion SLA &amp; Confirmation Receipt
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Once requested, data is removed from our live operational databases immediately or within a maximum of <strong>14 business days</strong>. Encrypted backup snapshots are overwritten following our rolling 30-day purge cycle. You will receive an official confirmation email once your deletion request is fulfilled.
        </p>
      </section>
    </LegalLayout>
  );
}
export default DataDeletionPage;
