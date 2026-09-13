import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import axiosClient from '../api/axiosClient.js';
import { BrandLoader } from '../components/BrandLoader.jsx';
import {
  ShoppingBag,
  Globe,
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Smartphone,
  Sliders,
  Send,
  Check,
  Zap,
} from 'lucide-react';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, completeOnboarding, updateUserData } = useAuth();

  // Wizard Step: 1, 2, 3, or 'completed'
  const [currentStep, setCurrentStep] = useState(1);

  // Common State
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Step 1 State: Store
  const [connectedStores, setConnectedStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [platform, setPlatform] = useState('SHOPIFY');
  const [storeUrl, setStoreUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  // Step 2 State: Meta WhatsApp
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState('');
  const [metaBusinessAccountId, setMetaBusinessAccountId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testFeedback, setTestFeedback] = useState(null);

  // Step 3 State: Quick Automations
  const [automations, setAutomations] = useState({
    ORDER_CREATED: true,
    COD_VERIFICATION: true,
    ABANDONED_CHECKOUT: true,
  });

  // Countdown for auto-redirect after celebration
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // 1. Fetch initial user stores and existing settings on mount
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingInitial(true);
      try {
        const [storesRes, settingsRes] = await Promise.allSettled([
          axiosClient.get('/dashboard/stores'),
          axiosClient.get('/settings/whatsapp'),
        ]);

        if (storesRes.status === 'fulfilled' && storesRes.value.data?.stores) {
          const stores = storesRes.value.data.stores;
          setConnectedStores(stores);
          if (stores.length > 0) {
            setSelectedStoreId(stores[0].id);
          }
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.settings) {
          const s = settingsRes.value.data.settings;
          if (s.metaPhoneNumberId) setMetaPhoneNumberId(s.metaPhoneNumberId);
          if (s.metaBusinessAccountId) setMetaBusinessAccountId(s.metaBusinessAccountId);
        }
      } catch (err) {
        console.warn('[Onboarding] Initial fetch warning:', err);
      } finally {
        setIsLoadingInitial(false);
      }
    }

    loadInitialData();
  }, []);

  // Listen for return from Shopify OAuth callback
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      const connectedShop = searchParams.get('store');
      const storeIdParam = searchParams.get('storeId');
      if (storeIdParam) {
        setSelectedStoreId(storeIdParam);
      }
      setSuccessNotice(
        `Shopify store "${connectedShop || 'your store'}" connected & webhooks installed successfully!`
      );
      setCurrentStep(2);
      // Refresh store list to include newly authorized store
      axiosClient.get('/dashboard/stores').then((res) => {
        if (res.data?.stores) {
          setConnectedStores(res.data.stores);
        }
      }).catch(() => {});
    }
  }, [searchParams]);

  // Countdown timer when reaching completed state
  useEffect(() => {
    if (currentStep !== 'completed') return;

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep, navigate]);

  // Handle Step 1: 1-Click Shopify OAuth Redirect
  const handleConnectShopify = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    const cleanedShop = storeUrl.trim();
    if (!cleanedShop) {
      setErrorMessage('Please enter your Shopify store domain (e.g. awesome-brand.myshopify.com or awesome-brand).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosClient.get(
        `/shopify/auth?shop=${encodeURIComponent(cleanedShop)}&json=true&app_url=${encodeURIComponent(window.location.origin)}`
      );
      if (res.data?.authUrl) {
        window.location.href = res.data.authUrl;
      } else {
        throw new Error('Failed to retrieve Shopify authorization URL.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to initiate Shopify connection.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  // Handle Step 1: Connect Store (WooCommerce / Manual)
  const handleConnectStore = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // If store is already selected and merchant clicks continue without filling form
      if (selectedStoreId && !storeUrl && !accessToken) {
        setCurrentStep(2);
        setIsSubmitting(false);
        return;
      }

      const payload = {
        userId: user.id,
        storeUrl,
        platform,
        accessToken,
        webhookSecret,
      };

      const res = await axiosClient.post('/stores/connect', payload);

      if (res.data?.success && res.data.store) {
        const newStore = res.data.store;
        setConnectedStores((prev) => [newStore, ...prev.filter((s) => s.id !== newStore.id)]);
        setSelectedStoreId(newStore.id);
        setSuccessNotice(`Store "${newStore.storeUrl}" connected successfully!`);
        setTimeout(() => setSuccessNotice(''), 3000);
        setCurrentStep(2);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to connect store.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Step 2: Save WhatsApp Settings
  const handleSaveWhatsApp = async (skip = false) => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (!skip && (metaPhoneNumberId || metaBusinessAccountId || metaAccessToken)) {
        await axiosClient.put('/settings/whatsapp', {
          metaPhoneNumberId,
          metaBusinessAccountId,
          metaAccessToken: metaAccessToken || undefined,
          storeId: selectedStoreId || undefined,
        });
      }
      setCurrentStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save WhatsApp settings.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test WhatsApp Connection
  const handleTestWhatsApp = async () => {
    if (!testPhoneNumber) {
      setTestFeedback({ success: false, message: 'Please enter a recipient test phone number.' });
      return;
    }

    setIsTestingWhatsApp(true);
    setTestFeedback(null);

    try {
      const res = await axiosClient.post('/settings/whatsapp/test', {
        recipientPhone: testPhoneNumber,
        metaPhoneNumberId: metaPhoneNumberId || undefined,
        metaAccessToken: metaAccessToken || undefined,
      });

      if (res.data?.success) {
        setTestFeedback({
          success: true,
          message: 'Test message sent successfully to your WhatsApp!',
        });
      } else {
        setTestFeedback({
          success: false,
          message: res.data?.message || 'Meta test failed.',
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'WhatsApp test dispatch failed.';
      setTestFeedback({ success: false, message: msg });
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  // Handle Step 3: Complete Onboarding & Save Automations
  const handleCompleteSetup = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // 1. If a store is connected, update batch automations
      if (selectedStoreId) {
        const batchRules = [
          {
            triggerEvent: 'ORDER_CREATED',
            isEnabled: automations.ORDER_CREATED,
            templateName: 'order_confirmation',
            languageCode: 'en',
          },
          {
            triggerEvent: 'COD_VERIFICATION',
            isEnabled: automations.COD_VERIFICATION,
            templateName: 'cod_interactive_verification',
            languageCode: 'en',
          },
          {
            triggerEvent: 'ABANDONED_CHECKOUT',
            isEnabled: automations.ABANDONED_CHECKOUT,
            templateName: 'abandoned_cart_recovery',
            languageCode: 'en',
          },
        ];

        try {
          await axiosClient.put(`/automations/${selectedStoreId}/batch`, { rules: batchRules });
        } catch (ruleErr) {
          console.warn('[Onboarding] Could not save rules in batch:', ruleErr.message);
        }
      }

      // 2. Call backend complete-onboarding API
      const res = await completeOnboarding();
      if (res?.success) {
        updateUserData({ isOnboarded: true });
        setCurrentStep('completed');
      } else {
        throw new Error('Failed to finalize onboarding status.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to complete onboarding.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <BrandLoader
        variant="fullscreen"
        showBrandTitle={true}
        showDots={false}
        showBar={true}
        size="md"
      />
    );
  }

  // Final Celebration State
  if (currentStep === 'completed') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow decorations */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-xl glass-panel bg-slate-900/90 border border-teal-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl text-center animate-in zoom-in-95 duration-300">
          {/* Glowing checkmark badge */}
          <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping opacity-75" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-teal-400 stroke-[3]" />
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Setup Complete!</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome to WaNotify
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
            Your automated WhatsApp and SMS communication pipeline is active and configured.
          </p>

          {/* Configuration Summary Card */}
          <div className="my-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-teal-400" />
                Store Connection:
              </span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {connectedStores[0]?.storeUrl || 'Connected'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-teal-400" />
                WhatsApp Cloud API:
              </span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {metaPhoneNumberId ? 'Custom Credentials' : 'Ready / Sandbox'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                Active Automations:
              </span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {Object.values(automations).filter(Boolean).length} Enabled
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Launch Merchant Dashboard</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-xs text-slate-500 mt-4">
            Redirecting automatically in <span className="text-teal-400 font-bold">{redirectCountdown}s</span>...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background ambient gradients */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <img
              src="/wa-logo.svg"
              alt="WaNotify"
              className="w-10 h-10 drop-shadow-md"
            />
            <span className="text-2xl font-black tracking-tight text-white">
              Wa<span className="text-teal-400">Notify</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Smart Onboarding Wizard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Let's get your store hooked up to automated WhatsApp alerts in 3 simple steps.
          </p>
        </div>

        {/* Step Indicator Tracker */}
        <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-6 shadow-lg">
          <div className="grid grid-cols-3 gap-2 relative">
            {/* Step 1 Pill */}
            <div
              className={`flex items-center gap-2 sm:gap-3 p-2 rounded-xl transition-all ${
                currentStep === 1
                  ? 'bg-teal-500/15 border border-teal-500/40 text-teal-300'
                  : currentStep > 1
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentStep === 1
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : currentStep > 1
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </div>
              <div className="hidden sm:block text-left truncate">
                <p className="text-xs font-bold leading-none">Step 1</p>
                <p className="text-[11px] opacity-80 truncate">Connect Store</p>
              </div>
            </div>

            {/* Step 2 Pill */}
            <div
              className={`flex items-center gap-2 sm:gap-3 p-2 rounded-xl transition-all ${
                currentStep === 2
                  ? 'bg-teal-500/15 border border-teal-500/40 text-teal-300'
                  : currentStep > 2
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentStep === 2
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : currentStep > 2
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </div>
              <div className="hidden sm:block text-left truncate">
                <p className="text-xs font-bold leading-none">Step 2</p>
                <p className="text-[11px] opacity-80 truncate">WhatsApp API</p>
              </div>
            </div>

            {/* Step 3 Pill */}
            <div
              className={`flex items-center gap-2 sm:gap-3 p-2 rounded-xl transition-all ${
                currentStep === 3
                  ? 'bg-teal-500/15 border border-teal-500/40 text-teal-300'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentStep === 3
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                3
              </div>
              <div className="hidden sm:block text-left truncate">
                <p className="text-xs font-bold leading-none">Step 3</p>
                <p className="text-[11px] opacity-80 truncate">Automations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: CONNECT STORE                                                     */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="glass-panel bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-teal-400" />
                  Connect Your E-Commerce Store
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authorize your store to receive order and checkout webhooks.
                </p>
              </div>
            </div>

            {/* If user already has connected store(s) */}
            {connectedStores.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                      {connectedStores[0].platform === 'SHOPIFY' ? 'SH' : 'WC'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        Connected Store: <span className="text-teal-300">{connectedStores[0].storeUrl}</span>
                      </p>
                      <p className="text-[11px] text-teal-400/80 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Ready to receive automated webhooks
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStoreId(connectedStores[0].id);
                      setCurrentStep(2);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5"
                  >
                    <span>Use This Store</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Platform Selector */}
              <div className="mb-5">
                <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                  Select Platform
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlatform('SHOPIFY')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                      platform === 'SHOPIFY'
                        ? 'bg-teal-500/15 border-teal-500 text-teal-300 shadow-sm shadow-teal-500/10'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>Shopify (1-Click)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlatform('WOOCOMMERCE')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                      platform === 'WOOCOMMERCE'
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-sm shadow-indigo-500/10'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>WooCommerce</span>
                  </button>
                </div>
              </div>

              {/* SHOPIFY 1-CLICK OAUTH FORM */}
              {platform === 'SHOPIFY' ? (
                <form onSubmit={handleConnectShopify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-teal-400" />
                      <span>Shopify Store Domain / Handle</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      placeholder="e.g. awesome-brand.myshopify.com or awesome-brand"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Enter your store name or myshopify.com domain. You will be redirected to Shopify to approve permissions in 1-click.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <BrandLoader variant="inline" message="Connecting to Shopify..." />
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Connect Shopify (1-Click Install)</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>
                      Automatic webhook installation included. We automatically subscribe to <span className="text-teal-300 font-mono">orders/create</span> and <span className="text-teal-300 font-mono">checkouts/update</span>.
                    </span>
                  </div>
                </form>
              ) : (
                /* WOOCOMMERCE MANUAL FORM */
                <form onSubmit={handleConnectStore} className="space-y-4">
                  {/* Store URL */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>WooCommerce Store URL</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      placeholder="e.g. https://my-store.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {/* API Access Token */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <span>Consumer Secret / Token</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="cs_xxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    />
                  </div>

                  {/* Webhook Secret */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span>Webhook Signing Secret</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      placeholder="whsec_xxxxxxxx"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    />
                  </div>

                  {/* Action Controls */}
                  <div className="pt-4 flex items-center justify-end gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <BrandLoader variant="inline" message="Connecting..." />
                      ) : (
                        <>
                          <span>Connect WooCommerce Store</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: META WHATSAPP SETUP                                               */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="glass-panel bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-teal-400" />
                  Meta WhatsApp Cloud API Setup
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your Meta developer credentials to send WhatsApp messages from your number.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Phone Number ID */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <span>Phone Number ID</span>
                  <span className="text-[11px] text-slate-500">(from Meta App Dashboard)</span>
                </label>
                <input
                  type="text"
                  value={metaPhoneNumberId}
                  onChange={(e) => setMetaPhoneNumberId(e.target.value)}
                  placeholder="e.g. 104829104820194"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 transition-colors font-mono"
                />
              </div>

              {/* WhatsApp Business Account ID */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <span>WhatsApp Business Account ID (WABA)</span>
                </label>
                <input
                  type="text"
                  value={metaBusinessAccountId}
                  onChange={(e) => setMetaBusinessAccountId(e.target.value)}
                  placeholder="e.g. 109283746592817"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 transition-colors font-mono"
                />
              </div>

              {/* System User Access Token */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Meta System User Access Token</span>
                </label>
                <input
                  type="password"
                  value={metaAccessToken}
                  onChange={(e) => setMetaAccessToken(e.target.value)}
                  placeholder="EAAGxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 transition-colors font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Leave blank to use pre-configured sandbox/system credentials during initial evaluation.
                </p>
              </div>

              {/* Optional Connection Test Card */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-teal-400" />
                  Test Live Connection (Optional)
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="+919876543210"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-teal-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestWhatsApp}
                    disabled={isTestingWhatsApp || !testPhoneNumber}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {isTestingWhatsApp ? (
                      <BrandLoader variant="inline" message="Pinging..." />
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Ping WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>

                {testFeedback && (
                  <div
                    className={`mt-2 p-2.5 rounded-xl text-[11px] flex items-center gap-2 ${
                      testFeedback.success
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    }`}
                  >
                    {testFeedback.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{testFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveWhatsApp(true)}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    Skip for Now
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveWhatsApp(false)}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <BrandLoader variant="inline" message="Saving..." />
                    ) : (
                      <>
                        <span>Continue to Automations</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: QUICK AUTOMATIONS                                                 */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="glass-panel bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-teal-400" />
                  Select Quick Automations
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Toggle the automated sequences you want WaNotify to run for your store.
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Card 1: COD Verification */}
              <div
                onClick={() =>
                  setAutomations((prev) => ({ ...prev, COD_VERIFICATION: !prev.COD_VERIFICATION }))
                }
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  automations.COD_VERIFICATION
                    ? 'bg-teal-500/10 border-teal-500/40 shadow-sm shadow-teal-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      automations.COD_VERIFICATION
                        ? 'bg-teal-500/20 text-teal-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Cash on Delivery (COD) Verification
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sends interactive Quick Reply buttons ("Confirm" / "Cancel") and automatically syncs response back to Shopify/WooCommerce.
                    </p>
                  </div>
                </div>

                <div
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                    automations.COD_VERIFICATION ? 'bg-teal-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      automations.COD_VERIFICATION ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Card 2: Abandoned Checkout Recovery */}
              <div
                onClick={() =>
                  setAutomations((prev) => ({
                    ...prev,
                    ABANDONED_CHECKOUT: !prev.ABANDONED_CHECKOUT,
                  }))
                }
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  automations.ABANDONED_CHECKOUT
                    ? 'bg-teal-500/10 border-teal-500/40 shadow-sm shadow-teal-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      automations.ABANDONED_CHECKOUT
                        ? 'bg-teal-500/20 text-teal-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Abandoned Checkout Recovery (30m Delay)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Triggers a delayed reminder with direct recovery link. Automatically skips if customer already purchased.
                    </p>
                  </div>
                </div>

                <div
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                    automations.ABANDONED_CHECKOUT ? 'bg-teal-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      automations.ABANDONED_CHECKOUT ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Card 3: Instant Order Confirmation */}
              <div
                onClick={() =>
                  setAutomations((prev) => ({ ...prev, ORDER_CREATED: !prev.ORDER_CREATED }))
                }
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  automations.ORDER_CREATED
                    ? 'bg-teal-500/10 border-teal-500/40 shadow-sm shadow-teal-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      automations.ORDER_CREATED
                        ? 'bg-teal-500/20 text-teal-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Instant Order Confirmation</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Dispatches immediate WhatsApp receipt with customer name, order number, and total.
                    </p>
                  </div>
                </div>

                <div
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                    automations.ORDER_CREATED ? 'bg-teal-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      automations.ORDER_CREATED ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompleteSetup}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 transition-all shadow-xl shadow-teal-500/25 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <BrandLoader variant="inline" message="Finalizing Setup..." />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Complete Setup & Launch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingPage;
