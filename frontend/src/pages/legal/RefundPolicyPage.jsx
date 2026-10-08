import React from 'react';
import { LegalLayout } from '../../components/LegalLayout.jsx';
import { CreditCard, RefreshCw, CheckCircle2, AlertCircle, XCircle, HelpCircle } from 'lucide-react';

export function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      subtitle="Clear, fair, and transparent billing terms for WaNotify subscriptions and payment processing via Stripe."
      badge="Billing & Refunds"
      lastUpdated="October 2026"
      icon={CreditCard}
    >
      {/* 7-Day Guarantee Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
        <h2 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          7-Day Money-Back Guarantee
        </h2>
        <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
          We want you to be completely satisfied with WaNotify. If you purchase any paid plan and find that the software does not meet your store's requirements, you can request a <strong>100% full refund within 7 days</strong> of your initial payment.
        </p>
      </div>

      {/* Section 1: Cancellation Process */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-teal-400" />
          1. Hassle-Free Instant Cancellation
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          You are never locked into a long-term contract. You can cancel your subscription at any time with a single click:
        </p>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-2">
          <ol className="list-decimal list-inside space-y-1.5 pl-1">
            <li>Log in to your WaNotify Dashboard at <a href="/login" className="text-teal-400 underline">wanotify.com/login</a>.</li>
            <li>Click <strong>Dashboard &rarr; Billing</strong> from the navigation menu.</li>
            <li>Click <strong>"Manage Subscription"</strong> to open the secure Stripe Customer Portal.</li>
            <li>Click <strong>"Cancel Plan"</strong> and confirm.</li>
          </ol>
          <p className="text-slate-400 text-[11px] pt-1">
            Upon cancellation, you will not be billed again. Your plan access will remain fully active until the end of your current paid billing cycle.
          </p>
        </div>
      </section>

      {/* Section 2: Refund Eligibility */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-400" />
          2. Refund Eligibility &amp; Windows
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-1.5 text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Eligible for Refund
            </h3>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>First-time subscription purchases requested within 7 days.</li>
              <li>Accidental duplicate transactions or duplicate billing errors.</li>
              <li>Severe platform downtime attributable to WaNotify core services.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-1.5 text-rose-400 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Non-Refundable Items
            </h3>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>Subsequent monthly renewals after the initial 7-day trial window.</li>
              <li>Accounts terminated due to spam or Meta WhatsApp policy violations.</li>
              <li>Direct Meta WhatsApp conversation fees charged directly by Meta.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3: Meta Conversation Fees Note */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-teal-400" />
          3. Clarification on Meta WhatsApp Official Fees
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Please note that Meta charges conversation fees for WhatsApp Business Cloud API based on message categories (Marketing vs. Utility) and user geography. These charges are billed directly by Meta to your WhatsApp Business Account. WaNotify platform subscriptions cover our automated webhook queues, software logic, and Shopify/WooCommerce integrations. WaNotify cannot refund fees paid directly to Meta Platforms.
        </p>
      </section>

      {/* Section 4: How to Request a Refund */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-teal-400" />
          4. How to Request a Refund
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          To request a refund within your 7-day guarantee window, simply contact our billing team:
        </p>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1.5">
          <p>Email: <a href="mailto:billing@wanotify.com" className="text-teal-400 hover:underline">billing@wanotify.com</a> or <a href="mailto:support@wanotify.com" className="text-teal-400 hover:underline">support@wanotify.com</a></p>
          <p>Please include your <strong>registered account email</strong> and <strong>Stripe invoice number</strong>.</p>
          <p className="text-slate-400 text-[11px]">Approved refunds are processed back to your original payment method (Credit Card/Debit Card) via Stripe within <strong>3 to 5 business days</strong>.</p>
        </div>
      </section>
    </LegalLayout>
  );
}
export default RefundPolicyPage;
