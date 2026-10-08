import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export function LegalLayout({
  title,
  subtitle,
  badge = 'Legal & Compliance',
  lastUpdated = 'October 2026',
  icon: Icon = ShieldCheck,
  children,
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [title]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950 relative overflow-x-hidden flex flex-col justify-between">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-teal-500/10 via-emerald-600/5 to-transparent blur-3xl pointer-events-none" />

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
              to="/login"
              className="hidden sm:inline-block text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Page Hero Header */}
        <div className="mb-10 sm:mb-12 border-b border-slate-800/80 pb-8 sm:pb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold mb-4">
            <Icon className="w-3.5 h-3.5" />
            <span>{badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed mb-4">
              {subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
            <span>Last Updated: <strong className="text-slate-400">{lastUpdated}</strong></span>
            <span>&bull;</span>
            <span>Platform: <strong className="text-slate-400">WaNotify Cloud Platform</strong></span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Official Compliance Document</span>
            </span>
          </div>
        </div>

        {/* Document Body */}
        <div className="text-slate-300 text-sm sm:text-base leading-relaxed space-y-8">
          {children}
        </div>

        {/* Support Helpdesk Callout Card */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-400" />
              Have Questions or Privacy Inquiries?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Our Data Protection &amp; Support Team is available 24/7 to answer compliance questions.
            </p>
          </div>
          <Link
            to="/contact"
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors shrink-0"
          >
            Contact Support &rarr;
          </Link>
        </div>
      </main>

      {/* Global Comprehensive SaaS Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400 text-xs mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/60">
            {/* Col 1: Brand Info */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <img src="/wa-logo.svg" alt="WaNotify" className="w-7 h-7 drop-shadow-md" />
                <span className="font-extrabold text-white text-base tracking-tight">
                  Wa<span className="text-teal-400">Notify</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enterprise-grade WhatsApp &amp; SMS automation for Shopify &amp; WooCommerce. Automate 2-way COD verification and recover abandoned checkouts.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-teal-400/90 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Meta Official Cloud API Integration</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">Product</p>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><Link to="/#features" className="hover:text-teal-300 transition-colors">Features &amp; Triggers</Link></li>
                <li><Link to="/#how-it-works" className="hover:text-teal-300 transition-colors">How It Works</Link></li>
                <li><Link to="/#pricing" className="hover:text-teal-300 transition-colors">Pricing Plans</Link></li>
                <li><Link to="/login" className="hover:text-teal-300 transition-colors">Merchant Dashboard</Link></li>
              </ul>
            </div>

            {/* Col 3: Legal & Compliance */}
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">Legal &amp; Compliance</p>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><Link to="/privacy" className="hover:text-teal-300 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-teal-300 transition-colors">Terms of Service</Link></li>
                <li><Link to="/data-deletion" className="hover:text-teal-300 transition-colors">User Data Deletion</Link></li>
                <li><Link to="/refund-policy" className="hover:text-teal-300 transition-colors">Refund &amp; Cancellation</Link></li>
              </ul>
            </div>

            {/* Col 4: Support & Security */}
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">Support &amp; Trust</p>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><Link to="/contact" className="hover:text-teal-300 transition-colors">Contact Support</Link></li>
                <li><span className="text-slate-500">support@wanotify.com</span></li>
                <li className="pt-2 text-[11px] text-slate-500">
                  Secured with 256-Bit SSL Encryption &amp; Stripe PCI-DSS Level 1 Gateway.
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>&copy; {new Date().getFullYear()} WaNotify SaaS Inc. All rights reserved.</p>
            <p>Designed for high-growth Shopify &amp; WooCommerce merchants worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
