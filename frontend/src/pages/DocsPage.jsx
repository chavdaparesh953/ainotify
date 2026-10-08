import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  ShoppingBag,
  Globe,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Key,
  Shield,
  Layers,
  Sparkles,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';

export function DocsPage() {
  const [activeTab, setActiveTab] = useState('meta'); // 'meta' | 'shopify' | 'woocommerce' | 'automations'
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950 flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-teal-500/10 via-emerald-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <img
              src="/wa-logo.svg"
              alt="WaNotify"
              className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-md group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-black tracking-tight text-white">
              Wa<span className="text-teal-400">Notify</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              to="/"
              className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>

            <Link
              to="/onboarding"
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Launch Setup Wizard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-8 border-b border-slate-800/80 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Merchant Setup Documentation</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3">
            WaNotify Documentation &amp; Setup Guides
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
            Everything you need to configure Meta WhatsApp Cloud API credentials, connect your e-commerce store, and launch high-converting WhatsApp automations in under 5 minutes.
          </p>
        </div>

        {/* Interactive Tab Switcher */}
        <div className="flex p-1 bg-slate-900/90 border border-slate-800 rounded-2xl gap-1 mb-8 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('meta')}
            className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'meta'
                ? 'bg-slate-800 text-teal-300 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-teal-400" />
            <span>Meta WhatsApp API</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shopify')}
            className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'shopify'
                ? 'bg-slate-800 text-teal-300 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-teal-400" />
            <span>Shopify Setup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('woocommerce')}
            className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'woocommerce'
                ? 'bg-slate-800 text-indigo-300 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>WooCommerce Setup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('automations')}
            className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'automations'
                ? 'bg-slate-800 text-amber-300 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>2-Way Automations</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: META WHATSAPP CLOUD API SETUP                                      */}
        {/* ========================================================================= */}
        {activeTab === 'meta' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Guide Header Banner */}
            <div className="p-5 sm:p-6 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-teal-400" />
                  Meta WhatsApp Cloud API (Takes 5 Minutes)
                </h3>
                <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                  Connect your official Meta developer credentials to send WhatsApp messages from your brand's number with zero intermediary markup.
                </p>
              </div>
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span>Open Meta Developers</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">1</span>
                <h3 className="text-base font-bold text-white">Create a Meta Developer Business App</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 pl-10 leading-relaxed">
                Log into <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-teal-400 underline">developers.facebook.com</a> with your Facebook account. Click <strong>My Apps &rarr; Create App</strong>, select <strong>"Other"</strong> as use case, and choose <strong>"Business"</strong> as App Type. Give it a name (e.g. <em>MyStore WhatsApp</em>).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">2</span>
                <h3 className="text-base font-bold text-white">Add the WhatsApp Product</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 pl-10 leading-relaxed">
                In your app dashboard, scroll down to <strong>Add products to your app</strong>, find <strong>WhatsApp</strong>, and click <strong>Set up</strong>. This unlocks the WhatsApp Cloud API panel.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">3</span>
                <h3 className="text-base font-bold text-white">Copy Phone Number ID &amp; WABA ID</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 pl-10 leading-relaxed">
                Under the left sidebar, click <strong>WhatsApp &rarr; API Setup</strong>. You will see two IDs displayed on screen:
              </p>
              <div className="pl-10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Field 1</span>
                    <span className="text-slate-300">Phone Number ID</span>
                  </div>
                  <span className="text-teal-400">e.g. 104829104820194</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Field 2</span>
                    <span className="text-slate-300">WhatsApp Business Account ID</span>
                  </div>
                  <span className="text-teal-400">e.g. 109283746592817</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 pl-10">
                Paste these two values into <strong>Step 2 of the WaNotify Onboarding Wizard</strong>.
              </p>
            </div>

            {/* Step 4: Permanent Token */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">4</span>
                <h3 className="text-base font-bold text-white">Generate Permanent System User Token (Never Expires)</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 pl-10 leading-relaxed">
                The temporary token on the API Setup page expires after 24 hours. For uninterrupted 24/7 automations, create a permanent System User token:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400 pl-10">
                <li>Go to <strong>business.facebook.com &rarr; Business Settings &rarr; Users &rarr; System Users</strong>.</li>
                <li>Click <strong>Add</strong>, name it <em>WaNotify System User</em>, set role to <strong>Admin</strong>.</li>
                <li>Under <strong>Assigned Assets</strong>, assign your WhatsApp Account with Full Control.</li>
                <li>Click <strong>Generate New Token</strong>, select scopes: <code className="text-teal-300">whatsapp_business_messaging</code> and <code className="text-teal-300">whatsapp_business_management</code>.</li>
                <li>Copy the generated token (starts with <code className="text-teal-300 font-mono">EAAG...</code>) and paste it into WaNotify.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SHOPIFY SETUP                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'shopify' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="p-5 sm:p-6 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-200">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-teal-400" />
                Connecting Your Shopify Store
              </h3>
              <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
                WaNotify connects to Shopify via private Admin API Custom Apps or the 1-Click App Store, listening for new orders and abandoned checkouts in real-time.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">How to create a Custom App in Shopify Admin (Takes 60 seconds):</h3>
              <ol className="list-decimal list-inside space-y-2.5 text-xs sm:text-sm text-slate-300 pl-1">
                <li>Log in to your <strong>Shopify Store Admin</strong>.</li>
                <li>Navigate to <strong>Settings (bottom-left gear icon) &rarr; Apps and sales channels &rarr; Develop apps</strong>.</li>
                <li>Click <strong>Allow custom app development</strong> (if first time), then click <strong>Create an app</strong>.</li>
                <li>Name the app <span className="text-teal-300 font-mono">WaNotify</span> and select your merchant account.</li>
                <li>Click <strong>Configure Admin API scopes</strong>, search and enable the following 3 permissions:
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs text-teal-300">
                    <span className="p-2 rounded-lg bg-slate-950 border border-slate-800">&bull; read_orders</span>
                    <span className="p-2 rounded-lg bg-slate-950 border border-slate-800">&bull; write_orders</span>
                    <span className="p-2 rounded-lg bg-slate-950 border border-slate-800">&bull; read_checkouts</span>
                  </div>
                </li>
                <li>Click <strong>Save</strong>, then click <strong>Install app</strong> at the top.</li>
                <li>Copy the <strong>Admin API access token</strong> (starts with <code className="text-teal-300 font-mono">shpat_...</code>) and paste it into WaNotify!</li>
              </ol>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: WOOCOMMERCE SETUP                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'woocommerce' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="p-5 sm:p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                Connecting Your WooCommerce WordPress Store
              </h3>
              <p className="text-xs sm:text-sm text-indigo-100/90 mt-1">
                Connect your WordPress e-commerce store using WooCommerce REST API keys or the 1-click WaNotify WordPress helper plugin.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">How to generate WooCommerce REST API Keys:</h3>
              <ol className="list-decimal list-inside space-y-2.5 text-xs sm:text-sm text-slate-300 pl-1">
                <li>Log in to your <strong>WordPress WP-Admin</strong> dashboard.</li>
                <li>Navigate to <strong>WooCommerce &rarr; Settings &rarr; Advanced &rarr; REST API</strong>.</li>
                <li>Click <strong>Add key</strong>.</li>
                <li>Enter Description: <span className="text-indigo-300 font-mono">WaNotify SaaS</span>.</li>
                <li>Set Permissions to <strong>Read/Write</strong>.</li>
                <li>Click <strong>Generate API key</strong>.</li>
                <li>Copy your <strong>Consumer Secret</strong> and <strong>Store URL</strong> into WaNotify.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: 2-WAY AUTOMATIONS & WRITE-BACK                                     */}
        {/* ========================================================================= */}
        {activeTab === 'automations' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                How Two-Way WhatsApp Automations Work
              </h3>
              <p className="text-xs sm:text-sm text-amber-100/90 mt-1">
                WaNotify doesn't just send one-way messages; it listens for customer responses and writes back the action directly into your store in under 200ms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* COD Verification Card */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 text-teal-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  Two-Way COD Order Verification
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When a COD order is placed, WaNotify triggers an interactive WhatsApp message with two quick-reply buttons: <strong>[Confirm Order]</strong> and <strong>[Cancel Order]</strong>.
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
                  <p className="text-emerald-400">&bull; Tap "Confirm" &rarr; Store order tagged "COD-Confirmed"</p>
                  <p className="text-rose-400">&bull; Tap "Cancel" &rarr; Order cancelled, stock restored</p>
                </div>
              </div>

              {/* Abandoned Cart Card */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 text-indigo-300">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  30-Min Delayed Cart Recovery
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When a shopper abandons checkout, a BullMQ background job delays the reminder by 30 minutes.
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
                  <p className="text-teal-300">&bull; Auto-checks if customer purchased organically</p>
                  <p className="text-slate-400">&bull; If purchased: message skipped (credits saved!)</p>
                  <p className="text-emerald-400">&bull; If unpurchased: sends 1-tap checkout recovery link</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 text-slate-400 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} WaNotify SaaS Inc. Need help? Contact <a href="mailto:support@wanotify.com" className="text-teal-400 hover:underline">support@wanotify.com</a></p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-teal-300">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-teal-300">Terms of Service</Link>
            <Link to="/security" className="hover:text-teal-300">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default DocsPage;
