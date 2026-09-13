import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLoader } from '../components/BrandLoader.jsx';
import {
  Play,
  ArrowLeft,
  Sparkles,
  Layers,
  RefreshCw,
  Store,
  CreditCard,
  Sliders,
  CheckCircle2,
  Check,
  Zap,
  Globe,
} from 'lucide-react';

export function LoaderPreviewPage() {
  // Scenario 1: Full-Screen App Boot
  const [isFullscreenBooting, setIsFullscreenBooting] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(3);

  // Scenario 2: Section Table Loading
  const [isTableLoading, setIsTableLoading] = useState(false);

  // Scenario 3: Button Action Loading States
  const [buttonLoadingState, setButtonLoadingState] = useState({
    save: false,
    connect: false,
    upgrade: false,
  });
  const [buttonSuccessState, setButtonSuccessState] = useState({
    save: false,
    connect: false,
    upgrade: false,
  });

  // Scenario 4: Deep Webhook Sync Loading
  const [isSyncLoading, setIsSyncLoading] = useState(false);

  // Trigger Fullscreen Boot Simulation
  const triggerFullscreenBoot = () => {
    setIsFullscreenBooting(true);
    setFullscreenCountdown(3);

    const interval = setInterval(() => {
      setFullscreenCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsFullscreenBooting(false);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Trigger Table Refresh
  const triggerTableRefresh = () => {
    setIsTableLoading(true);
    setTimeout(() => {
      setIsTableLoading(false);
    }, 2500);
  };

  // Trigger Button Simulation
  const triggerButtonAction = (type) => {
    setButtonLoadingState((prev) => ({ ...prev, [type]: true }));
    setButtonSuccessState((prev) => ({ ...prev, [type]: false }));

    setTimeout(() => {
      setButtonLoadingState((prev) => ({ ...prev, [type]: false }));
      setButtonSuccessState((prev) => ({ ...prev, [type]: true }));

      setTimeout(() => {
        setButtonSuccessState((prev) => ({ ...prev, [type]: false }));
      }, 2500);
    }, 2000);
  };

  // Trigger Webhook Sync Simulation
  const triggerSyncAction = () => {
    setIsSyncLoading(true);
    setTimeout(() => {
      setIsSyncLoading(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 relative selection:bg-teal-500 selection:text-slate-950">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-10 relative z-10">
        <div className="flex items-center justify-between gap-4 mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Real-World Loader Studio
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          WaNotify Brand Loader Simulator
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
          Test and verify every loader scenario across the app: initial site boot, dashboard tables, button clicks, and store syncs.
        </p>
      </div>

      {/* Interactive Showcase Grid */}
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* =================================================================== */}
        {/* SCENARIO 1: Full-Screen Initial Boot / Auth Check                   */}
        {/* =================================================================== */}
        <div className="glass-panel bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
                <h2 className="text-lg font-bold text-white">
                  1. Full-Screen App Boot / Auth Check (Tier 1)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Used on first page load or when verifying merchant login token in <code className="text-teal-300 font-mono">ProtectedRoute.jsx</code>.
              </p>
            </div>

            <button
              onClick={triggerFullscreenBoot}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Simulate Fullscreen Boot</span>
            </button>
          </div>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-semibold text-slate-200 block mb-1">Elements Shown:</span>
              <span>Logo + Spinning Dual Orbit Ring + Sonar Ping + WaNotify Brand + WhatsApp Typing Dots + Shimmer Bar</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-semibold text-slate-200 block mb-1">Theme & Styling:</span>
              <span>Dark Slate-950 backdrop with 20px glassmorphism blur and ambient radial emerald glow</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-semibold text-slate-200 block mb-1">Performance:</span>
              <span>GPU-accelerated transforms, 0 layout shifts (CLS: 0), instantaneous unmount on data arrival</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SCENARIO 2: Dashboard Table / Data Fetching Card                   */}
        {/* =================================================================== */}
        <div className="glass-panel bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-teal-400" />
                <h2 className="text-lg font-bold text-white">
                  2. Dashboard Section & Table Loading (Tier 2)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Used inside Message Logs, Analytics Charts, or Stores list. Clean, focused, no extra clutter.
              </p>
            </div>

            <button
              onClick={triggerTableRefresh}
              disabled={isTableLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTableLoading ? 'animate-spin text-teal-400' : ''}`} />
              <span>{isTableLoading ? 'Reloading Table...' : 'Refresh Logs Table'}</span>
            </button>
          </div>

          {/* Simulated Table Card Container */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden min-h-[260px] flex flex-col justify-center">
            {isTableLoading ? (
              <div className="py-12">
                <BrandLoader
                  variant="card"
                  message="Fetching latest WhatsApp message logs..."
                  subtext=""
                  showBrandTitle={false}
                  showDots={true}
                  showBar={false}
                  size="sm"
                  className="border-none bg-transparent shadow-none p-0"
                />
              </div>
            ) : (
              <div className="p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium border-b border-slate-800/80 pb-3">
                  <span>RECIPIENT & STORE</span>
                  <span>TRIGGER EVENT</span>
                  <span>STATUS</span>
                  <span>LATENCY</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-900">
                  <span className="font-semibold text-white">+1 (205) 555-0199 • My Shopify Store</span>
                  <span className="text-teal-300 font-mono">COD Verification</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">DELIVERED</span>
                  <span className="text-slate-500 font-mono">142ms</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-900">
                  <span className="font-semibold text-white">+91 98765 43210 • WooCommerce Outlet</span>
                  <span className="text-emerald-300 font-mono">Cart Recovery (30m)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">SENT</span>
                  <span className="text-slate-500 font-mono">118ms</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2">
                  <span className="font-semibold text-white">+44 7700 900077 • Fashion Boutique</span>
                  <span className="text-teal-300 font-mono">Order Confirmation</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">READ</span>
                  <span className="text-slate-500 font-mono">195ms</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* SCENARIO 3: Interactive Action Buttons                             */}
        {/* =================================================================== */}
        <div className="glass-panel bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">
                3. Button Action Click Loaders (Tier 3 Inline)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Inside buttons. Mini spinning ring with mini WaNotify vector icon. Preserves button geometry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Button 1: Save Settings */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-xs text-slate-400 block font-medium">Settings / Form Submit:</span>
              <button
                onClick={() => triggerButtonAction('save')}
                disabled={buttonLoadingState.save}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 cursor-pointer disabled:opacity-80"
              >
                {buttonLoadingState.save ? (
                  <BrandLoader variant="inline" message="Saving Rules..." />
                ) : buttonSuccessState.save ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <>
                    <Sliders className="w-4 h-4" />
                    <span>Save Automations</span>
                  </>
                )}
              </button>
            </div>

            {/* Button 2: Connect Store */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-xs text-slate-400 block font-medium">OAuth Store Connect:</span>
              <button
                onClick={() => triggerButtonAction('connect')}
                disabled={buttonLoadingState.connect}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-md shadow-teal-500/25 cursor-pointer disabled:opacity-80"
              >
                {buttonLoadingState.connect ? (
                  <BrandLoader variant="inline" message="Connecting Store..." />
                ) : buttonSuccessState.connect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Store Connected!</span>
                  </>
                ) : (
                  <>
                    <Store className="w-4 h-4" />
                    <span>Connect Shopify Store</span>
                  </>
                )}
              </button>
            </div>

            {/* Button 3: Stripe Upgrade */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-xs text-slate-400 block font-medium">Stripe Checkout / Billing:</span>
              <button
                onClick={() => triggerButtonAction('upgrade')}
                disabled={buttonLoadingState.upgrade}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
              >
                {buttonLoadingState.upgrade ? (
                  <BrandLoader variant="inline" message="Redirecting to Stripe..." />
                ) : buttonSuccessState.upgrade ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Opening Session...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-teal-400" />
                    <span>Upgrade to Growth $29</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SCENARIO 4: High-Stakes Store Connection & Webhook Sync             */}
        {/* =================================================================== */}
        <div className="glass-panel bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-teal-400" />
                <h2 className="text-lg font-bold text-white">
                  4. Deep Webhook Sync (With Technical Note)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Shown during store OAuth handshake or when synchronizing HMAC webhooks. Shows technical context.
              </p>
            </div>

            <button
              onClick={triggerSyncAction}
              disabled={isSyncLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncLoading ? 'animate-spin' : ''}`} />
              <span>{isSyncLoading ? 'Testing Webhooks...' : 'Test Webhook Sync'}</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 flex items-center justify-center">
            {isSyncLoading ? (
              <BrandLoader
                variant="card"
                message="Verifying Shopify Webhook Endpoints..."
                subtext="Validating HMAC-SHA256 signature & registering BullMQ job processors"
                showBrandTitle={false}
                showDots={true}
                showBar={true}
                size="md"
                className="border-none bg-transparent shadow-none p-0"
              />
            ) : (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">All Store Endpoints Active</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Click 'Test Webhook Sync' above to preview the loader with technical note in action.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay Triggered View */}
      {isFullscreenBooting && (
        <div className="relative">
          <BrandLoader
            variant="fullscreen"
            message="Launching WaNotify Dashboard..."
            subtext="Establishing encrypted connection to Meta Graph API & Shopify"
            showBrandTitle={true}
            showDots={true}
            showBar={true}
            size="md"
          />
          {/* Floating dismiss helper pill */}
          <div className="fixed top-6 right-6 z-[60] px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-300 shadow-xl flex items-center gap-2">
            <span>Auto-dismissing in</span>
            <span className="text-teal-400 font-bold">{fullscreenCountdown}s</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoaderPreviewPage;
