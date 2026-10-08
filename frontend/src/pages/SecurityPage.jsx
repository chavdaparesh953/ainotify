import React from 'react';
import { LegalLayout } from '../components/LegalLayout.jsx';
import { ShieldCheck, Lock, Server, Key, EyeOff, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

export function SecurityPage() {
  return (
    <LegalLayout
      title="Security & Data Protection"
      subtitle="Enterprise-grade encryption, HMAC verification, and zero-compromise data privacy designed for mission-critical e-commerce operations."
      badge="Enterprise Security Standards"
      lastUpdated="October 2026"
      icon={ShieldCheck}
    >
      {/* Security Highlight Box */}
      <div className="p-5 sm:p-6 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-200">
        <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-400" />
          Our Security Promise to E-Commerce Merchants
        </h2>
        <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
          At WaNotify, security is not an afterthought—it is the foundation of our architecture. We treat your store credentials, Meta Cloud API tokens, and customer order records with the highest standards of cryptographic protection, ensuring zero unauthorized access and zero data monetization.
        </p>
      </div>

      {/* Grid: Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">AES-256 Secret Encryption</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All private API access tokens (Shopify Admin tokens, WooCommerce consumer secrets, and Meta System User tokens) are encrypted at rest using military-grade AES-256 encryption. Plaintext secrets are never logged in application traces.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Cryptographic HMAC Verification</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every incoming webhook payload from Shopify, WooCommerce, and Meta WhatsApp is authenticated via HMAC-SHA256 signatures before entering our BullMQ queue. Spoofed, forged, or unverified requests are rejected in under 20ms.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">TLS 1.3 Transmission Security</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All external and internal network traffic is encrypted via Transport Layer Security (TLS 1.3 / HTTPS). Weak ciphers and insecure HTTP connections are strictly prohibited and redirected.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <EyeOff className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Zero Payment Data Storage</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            WaNotify never stores credit card details or CVVs. All subscription billing transactions are processed directly via Stripe, an audited PCI-DSS Level 1 Service Provider.
          </p>
        </div>
      </div>

      {/* Section 1: Official Meta Cloud API Architecture */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-teal-400" />
          1. Official Meta Graph API Architecture (No Unofficial Scrapers)
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Unlike risky unauthorized third-party WhatsApp tools that use reverse-engineered browser automation (which frequently results in permanent phone number bans), WaNotify connects <strong>directly to the official Meta WhatsApp Business Cloud API (`graph.facebook.com/v18.0`)</strong>.
        </p>
        <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside pl-2">
          <li><strong>Zero Phone Number Ban Risk:</strong> All message templates are reviewed and approved directly by Meta's automated compliance scanners.</li>
          <li><strong>Direct Webhook Latency:</strong> Inbound button presses (Confirm COD / Cancel) flow directly from Meta's edge servers to our Redis queue.</li>
          <li><strong>End-to-End Delivery Recipient Security:</strong> WhatsApp messages are encrypted end-to-end between Meta and the recipient's device.</li>
        </ul>
      </section>

      {/* Section 2: Queue Isolation & Rate Limiting */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-teal-400" />
          2. BullMQ Worker Isolation &amp; Rate Limiting
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Our message processing pipeline is architected using BullMQ backed by dedicated Redis memory stores:
        </p>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300 space-y-2">
          <p className="flex items-center gap-2 text-teal-300 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Multi-Tenant Queue Isolation
          </p>
          <p className="text-slate-400 leading-relaxed">
            High-volume flash sales on one merchant store will never degrade delivery speed for other merchants. Each store's webhook pipeline operates with adaptive backoff rate-limiting to prevent exceeding Meta's Cloud API limits.
          </p>
        </div>
      </section>

      {/* Section 3: Data Minimization & Automatic Purging */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-teal-400" />
          3. Data Minimization &amp; 90-Day Rolling Purge
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          We practice strict data minimization. We only store the minimal fields needed to deliver and audit a message (Recipient Phone, Order ID, Timestamp, Delivery Status). Raw message payload logs are automatically pruned after 90 days.
        </p>
      </section>

      {/* Section 4: Vulnerability Disclosure */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-400" />
          4. Responsible Vulnerability Disclosure
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          If you are a security researcher and believe you have discovered a security vulnerability in WaNotify, we encourage you to notify us promptly:
        </p>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
          <p>Security Team Contact: <a href="mailto:security@wanotify.com" className="text-teal-400 hover:underline">security@wanotify.com</a></p>
          <p className="text-[11px] text-slate-400">We acknowledge security reports within 24 hours and commit to resolving critical findings without penalty to ethical researchers.</p>
        </div>
      </section>
    </LegalLayout>
  );
}
export default SecurityPage;
