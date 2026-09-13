import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  MessageSquareDot,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Zap,
  Sliders,
  Clock,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Store,
  CreditCard,
  Layers,
  Send,
  Check,
  ExternalLink,
  Menu,
  X,
  XCircle,
  TrendingUp,
  Flame,
  PackageCheck,
  BarChart3,
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // FAQ and Mobile Menu states
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Pricing Currency Switcher state ('USD' | 'INR')
  const [currency, setCurrency] = useState('USD');

  // Interactive WhatsApp simulation states (Zero JS bundle overhead)
  const [demoStatus, setDemoStatus] = useState('confirmed'); // 'confirmed' | 'cancelled'
  const [isUpdatingDemo, setIsUpdatingDemo] = useState(false);

  const handleDemoAction = (action) => {
    if (action === demoStatus) return;
    setIsUpdatingDemo(true);
    setTimeout(() => {
      setDemoStatus(action);
      setIsUpdatingDemo(false);
    }, 150);
  };

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const faqs = [
    {
      question: 'How does the Two-Way COD Order Verification work?',
      answer:
        'When a customer places a Cash on Delivery order on your Shopify or WooCommerce store, WaNotify immediately triggers an interactive Meta WhatsApp message with "Confirm Order" and "Cancel Order" buttons. When the customer taps a button, WaNotify instantly writes back the confirmation to your store—appending tags like "COD-Confirmed" or updating order status to "Processing" in under 200ms.',
    },
    {
      question: 'What is the Delayed Abandoned Checkout Recovery sequence?',
      answer:
        'Instead of spamming customers instantly, WaNotify schedules a high-converting reminder 30 minutes after cart abandonment using a background BullMQ queue. When the job triggers, it automatically checks your store to verify if the customer already bought the items. If they purchased organically, the message is gracefully skipped, saving you credits.',
    },
    {
      question: 'Do I need a Meta WhatsApp Business Account to get started?',
      answer:
        'You can sign up and test immediately using sandbox credentials! For live customer messaging, you can easily plug in your official Meta Cloud API credentials (Phone Number ID, WABA ID, and System Token) via our 3-step setup wizard.',
    },
    {
      question: 'Can I customize the message templates and variables?',
      answer:
        'Yes! Our Custom Template Engine allows you to map dynamic variables like {{1}} (Customer Name), {{2}} (Order Number), and {{3}} (Direct Checkout Recovery Link) to approved Meta WhatsApp Cloud API templates.',
    },
    {
      question: 'Can I upgrade, downgrade, or cancel anytime?',
      answer:
        'Absolutely. We offer self-service billing powered by Stripe. You can upgrade, downgrade, or cancel your subscription at any time with zero lock-in contracts.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background Ambient Glow Gradients (GPU-Accelerated Pulse) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-teal-500/15 via-emerald-600/10 to-transparent blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-[1800px] left-0 w-[600px] h-[600px] bg-teal-500/10 blur-3xl pointer-events-none animate-pulse-glow" />

      {/* ========================================================================= */}
      {/* 1. STICKY GLASS NAVBAR                                                    */}
      {/* ========================================================================= */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <img
              src="/wa-logo.svg"
              alt="WaNotify"
              className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-md group-hover:scale-105 transition-transform shrink-0"
            />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white whitespace-nowrap">
              Wa<span className="text-teal-400">Notify</span>
            </span>
          </Link>

          {/* Desktop Nav Links (Visible on LG screens >=1024px) */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-teal-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-teal-400 transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-teal-400 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-teal-400 transition-colors">
              FAQ
            </a>
          </div>

          {/* Action CTAs + Mobile Menu Trigger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20 transition-all whitespace-nowrap"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-md sm:shadow-lg shadow-teal-500/25 transition-all whitespace-nowrap"
                >
                  <span>
                    <span className="hidden sm:inline">Start Free Trial</span>
                    <span className="inline sm:hidden">Free Trial</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              </>
            )}

            {/* Mobile & Tablet Menu Toggle Button (< 1024px) */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Navigation Dropdown Drawer (< 1024px) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl px-4 py-5 shadow-2xl animate-in slide-in-from-top duration-200">
            <div className="flex flex-col space-y-3 text-sm font-medium text-slate-300">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:text-teal-400 hover:bg-slate-900/70 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:text-teal-400 hover:bg-slate-900/70 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:text-teal-400 hover:bg-slate-900/70 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:text-teal-400 hover:bg-slate-900/70 transition-colors"
              >
                FAQ
              </a>

              <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/dashboard');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20 transition-all"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/25 transition-all"
                    >
                      <span>Start 14-Day Free Trial</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Announcement Badge with Subtle Shimmer */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full shimmer-badge border border-teal-500/40 text-teal-300 text-xs font-semibold mb-6 sm:mb-8 whitespace-nowrap max-w-full shadow-sm shadow-teal-500/15">
            <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
            <span className="truncate">Next-Gen E-Commerce Automation</span>
            <span className="text-teal-500/50 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">Shopify & WooCommerce</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-5xl mx-auto leading-[1.15] sm:leading-[1.1]">
            Turn Every WhatsApp Chat Into E-Commerce Revenue —{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-200">
              Automatically.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Stop losing sales to abandoned carts. Automate Shopify & WooCommerce order updates,
            shipping alerts, and instant cart recovery in under 3 minutes. No coding needed.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center gap-2 group whitespace-nowrap"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#pricing"
              className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>See Pricing & Plans</span>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> 3-minute store onboarding
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> Official Meta Cloud API
            </span>
          </div>

          {/* ======================================================================= */}
          {/* 3. INTERACTIVE FLOATING SAAS MOCKUP (GPU Floating Animation)             */}
          {/* ======================================================================= */}
          <div className="mt-14 sm:mt-20 relative max-w-5xl mx-auto animate-float">
            {/* Ambient Background Box Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-3xl blur-2xl opacity-25" />

            <div className="relative rounded-3xl border border-slate-700/80 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-2xl">
              {/* Window Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs font-mono text-slate-400 hidden sm:inline">
                    wanotify-engine • live store sync
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Shopify Store Connected</span>
                </div>
              </div>

              {/* Window Body: Dashboard & WhatsApp Chat Grid */}
              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center text-left">
                {/* Left Column: Live Analytics Cards */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">WhatsApp Open Rate</p>
                      <p className="text-2xl sm:text-3xl font-black text-white mt-1">98.4%</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold text-xs">
                      +420% vs Email
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Abandoned Checkouts Saved</p>
                      <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">₹45,00,000+</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
                      +34.2% Recovery Rate
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">COD Return-to-Origin (RTO)</p>
                      <p className="text-2xl sm:text-3xl font-black text-teal-300 mt-1">-58%</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold text-xs">
                      Instant 2-Way Writeback
                    </div>
                  </div>
                </div>

                {/* Right Column: Realistic WhatsApp Interactive Message Simulation */}
                <div className="lg:col-span-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-inner">
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-800">
                    <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                      W
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Your Brand Outlet</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <p className="text-[10px] text-slate-500">Official WhatsApp Business Account</p>
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 relative">
                    <div className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">
                      COD Order Verification
                    </div>
                    <p className="text-slate-200">
                      Hi <span className="text-white font-semibold">Sarah</span>, thank you for
                      ordering with us! Order <span className="text-teal-300 font-mono">#1082</span>{' '}
                      totaling <span className="text-white font-semibold">$124.00</span> has been
                      received.
                    </p>
                    <p className="text-slate-300">
                      Payment method is <span className="font-semibold text-white">Cash on Delivery</span>.
                      Please confirm your delivery address:
                    </p>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
                      📍 742 Evergreen Terrace, Springfield
                    </div>

                    {/* Interactive Quick Reply Buttons (Clickable Demo) */}
                    <div className="pt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDemoAction('confirmed')}
                        className={`py-2.5 px-2 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                          demoStatus === 'confirmed'
                            ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-300 shadow-sm shadow-emerald-500/30 scale-[1.02]'
                            : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40'
                        }`}
                        title="Click to test Confirm Order write-back"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="whitespace-nowrap">Confirm Order</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDemoAction('cancelled')}
                        className={`py-2.5 px-2 rounded-xl text-center font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                          demoStatus === 'cancelled'
                            ? 'bg-rose-500/20 border border-rose-400 text-rose-300 shadow-sm shadow-rose-500/30 scale-[1.02]'
                            : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-rose-300 hover:border-rose-500/40'
                        }`}
                        title="Click to test Cancel Order write-back"
                      >
                        <span className="whitespace-nowrap">Cancel Order</span>
                      </button>
                    </div>
                  </div>

                  {/* Automated Write-Back Status Indicator with Live Dynamic Writeback Feedback */}
                  <div
                    className={`mt-3 p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-medium overflow-hidden transition-all duration-300 ${
                      isUpdatingDemo ? 'opacity-40 scale-[0.98]' : 'opacity-100 scale-100'
                    } ${
                      demoStatus === 'confirmed'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Zap
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          demoStatus === 'confirmed' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      />
                      <span className="text-slate-300 text-[11px] sm:text-xs shrink-0">Shopify Tag:</span>
                      <span
                        className={`font-mono font-bold text-[11px] sm:text-xs px-1.5 py-0.5 rounded whitespace-nowrap transition-colors ${
                          demoStatus === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {demoStatus === 'confirmed' ? 'COD-Confirmed' : 'COD-Cancelled'}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono opacity-90 shrink-0 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-700/50">
                      ⚡ {demoStatus === 'confirmed' ? '142ms' : '118ms'} writeback
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SUPPORTED INTEGRATIONS BAR                                             */}
      {/* ========================================================================= */}
      <section className="py-12 border-y border-slate-800/80 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-6">
            Native integrations built for modern e-commerce stacks
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 opacity-75 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-lg">
              <Store className="w-6 h-6 text-teal-400" />
              <span>Shopify Admin REST & GraphQL</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-bold text-lg">
              <ShoppingBag className="w-6 h-6 text-indigo-400" />
              <span>WooCommerce REST v3</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-bold text-lg">
              <MessageSquareDot className="w-6 h-6 text-emerald-400" />
              <span>Meta WhatsApp Cloud API</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-bold text-lg">
              <CreditCard className="w-6 h-6 text-sky-400" />
              <span>Stripe Subscriptions</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FEATURES GRID (Clean, Unified 3x2 Layout)                              */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <h2 className="text-xs uppercase font-bold tracking-widest text-teal-400 mb-3">
              Comprehensive WhatsApp Automation Suite
            </h2>
            <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Engineered to convert every drop-off into revenue.
            </p>
            <p className="mt-4 text-base sm:text-lg text-slate-400">
              Stop relying on low-converting emails that land in spam folders. WaNotify connects directly to your customers where they read 98% of messages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Abandoned Cart Recovery (The Money Maker) */}
            <div className="glass-panel bg-slate-900/70 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-500/10 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                Don't let customers walk away.
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                When a shopper leaves items in their cart, WaNotify automatically sends a friendly WhatsApp reminder 30 minutes later. Bring them back with a 1-click checkout link.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-semibold text-teal-400 flex items-center gap-1">
                <span>30-minute smart recovery sequence</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2: Seamless Transactional Flow */}
            <div className="glass-panel bg-slate-900/70 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-500/10 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PackageCheck className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                Keep buyers updated to doorstep.
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Instant WhatsApp triggers for Order Placed, Payment Confirmed, Shipped, and Delivered. Keep customers informed with zero manual tracking.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-semibold text-teal-400 flex items-center gap-1">
                <span>End-to-end customer updates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3: Real Revenue & ROI Dashboard */}
            <div className="glass-panel bg-slate-900/70 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-500/10 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                See exact money recovered.
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Stop guessing if automation works. Our live dashboard tracks every single rupee recovered from abandoned carts and automated flows in real time.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-semibold text-teal-400 flex items-center gap-1">
                <span>Direct rupee attribution</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 4: Instant COD Order Verification (Slash RTO) */}
            <div className="glass-panel bg-slate-900/70 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-500/10 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                Instant COD Order Verification (Slash RTO)
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Slash Return-to-Origin (RTO) rates. Dispatches interactive WhatsApp buttons ("Confirm" / "Cancel"). Customer responses instantly sync back to Shopify as tags or WooCommerce order status.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-semibold text-teal-400 flex items-center gap-1">
                <span>Automatic order tag write-back</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 5: Custom Template Engine */}
            <div className="glass-panel bg-slate-900/70 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-500/10 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sliders className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                Custom Template Engine
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Map arbitrary customer variables (<span className="font-mono text-teal-300">{'{{1}}'}</span>, <span className="font-mono text-teal-300">{'{{2}}'}</span>), recovery URLs, and multilingual templates approved by Meta directly from a visual web builder.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-semibold text-teal-400 flex items-center gap-1">
                <span>Multi-tenant rule customization</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 6: Enterprise-Grade HMAC Security */}
            <div className="glass-panel bg-slate-900/70 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-500/10 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                Enterprise-Grade HMAC Security
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Inbound webhooks are verified via Shopify Base64 HMAC-SHA256 signatures to protect against spoofing, ensuring tamper-proof order processing.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-semibold text-teal-400 flex items-center gap-1">
                <span>HMAC-SHA256 cryptographic check</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. HOW IT WORKS (3 SIMPLE STEPS)                                          */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-slate-900/40 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <h2 className="text-xs uppercase font-bold tracking-widest text-teal-400 mb-3">
              Frictionless Setup
            </h2>
            <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Start recovering checkouts in under 3 minutes.
            </p>
            <p className="mt-4 text-base sm:text-lg text-slate-400">
              No complicated code or developer requirements. Connect your store and let our automations run on autopilot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="glass-panel bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-8 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/5 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 font-black text-xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                1
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-3">
                Connect Your Store
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Link your Shopify or WooCommerce store in our Smart Onboarding Wizard. Webhooks are configured automatically with secure HMAC cryptographic validation.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-panel bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-8 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/5 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 font-black text-xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                2
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-3">
                Set Up Automations
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Toggle COD Interactive Verification, 30-Minute Cart Recovery, and Order Confirmation alerts with a single click. Customize templates as needed.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-panel bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-8 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/5 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 font-black text-xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                3
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-3">
                Boost Revenue & Slash RTO
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Customer replies automatically update your store backend in real-time. Unconverted carts receive tracked payment links, unlocking immediate profits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. PRICING SECTION (MATCHING BACKEND STRIPE TIERS)                        */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-24 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <h2 className="text-xs uppercase font-bold tracking-widest text-teal-400 mb-3">
              Simple, Transparent Pricing
            </h2>
            <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Plans tailored to every growth stage.
            </p>
            <p className="mt-4 text-base sm:text-lg text-slate-400">
              Start free today and scale as your e-commerce order volume explodes.
            </p>

            {/* Currency Selector Toggle (USD / INR) */}
            <div className="mt-8 inline-flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currency === 'INR'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                INR (₹)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1: Starter Free */}
            <div className="glass-panel bg-slate-900/70 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Starter Free
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl sm:text-5xl font-black text-white">
                    {currency === 'INR' ? '₹0' : '$0'}
                  </span>
                  <span className="text-sm text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  Perfect for bootstrapping new stores testing WhatsApp automation.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>1 Connected Store (Shopify or WooCommerce)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>100 WhatsApp & SMS messages / mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Standard Order Confirmation triggers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Community Support</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white text-center transition-colors block"
              >
                Get Started Free
              </Link>
            </div>

            {/* Plan 2: Growth Basic (Most Popular) */}
            <div className="glass-panel bg-slate-900/90 border-2 border-teal-500 rounded-3xl p-8 flex flex-col justify-between relative shadow-2xl shadow-teal-500/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-extrabold text-xs tracking-wider uppercase shadow-md">
                Most Popular
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
                  Growth Basic
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl sm:text-5xl font-black text-white">
                    {currency === 'INR' ? '₹2,499' : '$29'}
                  </span>
                  <span className="text-sm text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  For scaling DTC brands looking to slash COD cancellations and recover lost carts.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="font-semibold text-white">Up to 3 Connected Stores</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>5,000 WhatsApp & SMS messages / mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Two-Way COD Interactive Verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Delayed 30-min Abandoned Cart Recovery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Custom Template Variable Mapper</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Priority Queue Processing</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-center shadow-lg shadow-teal-500/25 transition-all block"
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Plan 3: Scale Pro */}
            <div className="glass-panel bg-slate-900/70 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Scale Pro
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl sm:text-5xl font-black text-white">
                    {currency === 'INR' ? '₹6,499' : '$79'}
                  </span>
                  <span className="text-sm text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  High-volume high-growth e-commerce powerhouses and multi-brand agencies.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="font-semibold text-white">Unlimited Connected Stores</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>25,000 WhatsApp & SMS messages / mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>All Triggers (Order, Shipping, Abandoned Cart, COD)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Highest Priority BullMQ Queue</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Dedicated Meta API Support & 24/7 SLA</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white text-center transition-colors block"
              >
                Scale Your Operations
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. MERCHANT FAQ ACCORDION                                                 */}
      {/* ========================================================================= */}
      <section id="faq" className="py-24 bg-slate-900/40 border-y border-slate-800/80 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase font-bold tracking-widest text-teal-400 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything you need to know
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="glass-panel bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 text-slate-200 hover:text-white transition-colors"
                  >
                    <span className="text-base sm:text-lg font-bold">{faq.question}</span>
                    <span className="p-1.5 rounded-lg bg-slate-800 text-teal-400 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-slate-800/50 pt-4 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FINAL FOOTER CTA BANNER                                                */}
      {/* ========================================================================= */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="glass-panel bg-gradient-to-b from-teal-950/40 via-slate-900 to-slate-950 border border-teal-500/30 rounded-3xl p-10 sm:p-16 shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to turn WhatsApp into your highest-converting channel?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Stop losing sales to abandoned carts. Automate Shopify & WooCommerce order updates, shipping alerts, and instant cart recovery in under 3 minutes.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-xl shadow-teal-500/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Launch Your Free Store Integration Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#pricing"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl text-base font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Explore Pricing & Plans
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/wa-logo.svg"
              alt="WaNotify"
              className="w-8 h-8 drop-shadow-md"
            />
            <span className="font-extrabold text-white text-base tracking-tight">
              Wa<span className="text-teal-400">Notify</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-slate-400 font-medium">
            <a href="#features" className="hover:text-teal-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-teal-400 transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-teal-400 transition-colors">
              Pricing
            </a>
            <Link to="/login" className="hover:text-teal-400 transition-colors">
              Login
            </Link>
          </div>

          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} WaNotify SaaS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
