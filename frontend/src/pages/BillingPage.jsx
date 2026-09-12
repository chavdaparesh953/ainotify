import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import {
  CreditCard,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Store,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function BillingPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  // URL query banners
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await axiosClient.get('/billing/current-plan');
      if (res.data?.success) {
        setSubscription(res.data.subscription);
        setAvailablePlans(res.data.availablePlans || {});
      }
    } catch (err) {
      console.error('Failed to load subscription data:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to fetch current billing plan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpgrade = async (planKey) => {
    try {
      setUpgradingPlan(planKey);
      setErrorMsg('');
      const origin = window.location.origin;
      const res = await axiosClient.post('/billing/create-checkout-session', {
        plan: planKey,
        successUrl: `${origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancelUrl: `${origin}/dashboard/billing?canceled=true`,
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Checkout creation failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to start Stripe Checkout.');
      setUpgradingPlan(null);
    }
  };

  const handleManagePortal = async () => {
    try {
      setPortalLoading(true);
      setErrorMsg('');
      const origin = window.location.origin;
      const res = await axiosClient.post('/billing/customer-portal', {
        returnUrl: `${origin}/dashboard/billing`,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Customer portal error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to open Stripe Customer Portal.');
      setPortalLoading(false);
    }
  };

  const currentPlan = subscription?.plan || 'FREE';
  const usage = subscription?.usage || {
    connectedStores: 0,
    maxStores: 1,
    messagesThisMonth: 0,
    maxMessagesPerMonth: 100,
    storeQuotaPercent: 0,
    messageQuotaPercent: 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Subscription & Plans
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Scale your e-commerce WhatsApp & SMS automations with transparent, high-ROI plans.
        </p>
      </div>

      {/* Query Notification Alerts */}
      {isSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Payment Succeeded!</strong> Your subscription has been updated. Your new store and message quotas are now active.
            </span>
          </div>
        </div>
      )}

      {isCanceled && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>Checkout was canceled. No charges were made to your card.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active Subscription & Quota Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Current Subscription</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    subscription?.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : subscription?.status === 'TRIAL'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {subscription?.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tier: <strong className="text-emerald-400">{subscription?.planDetails?.name || currentPlan}</strong>
              </p>
            </div>
          </div>

          {/* Customer Portal Button */}
          {subscription?.stripeCustomerId && (
            <button
              onClick={handleManagePortal}
              disabled={portalLoading}
              className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {portalLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Manage Billing in Stripe</span>
            </button>
          )}
        </div>

        {/* Real-time Usage Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          {/* Connected Stores Quota */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                Connected Stores
              </span>
              <span className="font-mono text-white font-semibold">
                {usage.connectedStores} / {usage.maxStores > 900 ? 'Unlimited' : usage.maxStores}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${Math.min(100, usage.storeQuotaPercent)}%` }}
              />
            </div>
          </div>

          {/* Monthly Messages Quota */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                Messages This Month
              </span>
              <span className="font-mono text-white font-semibold">
                {usage.messagesThisMonth.toLocaleString()} / {usage.maxMessagesPerMonth.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${Math.min(100, usage.messageQuotaPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Matrix */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Available Subscription Tiers
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Automated WhatsApp messaging that pays for itself with recovered abandoned checkouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1: Free */}
          <div
            className={`glass-panel rounded-3xl p-6 flex flex-col justify-between relative transition-colors duration-200 ${
              currentPlan === 'FREE'
                ? 'border-slate-700 bg-slate-900/60'
                : 'border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Starter
                </span>
                {currentPlan === 'FREE' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Current
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-white">$0</span>
                <span className="text-xs text-slate-400">/month</span>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Ideal for trying out webhook ingestion and initial store setups.
              </p>

              <ul className="space-y-3 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1 Connected Store</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100 WhatsApp & SMS messages / mo</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard Order Confirmation template</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Community Support</span>
                </li>
              </ul>
            </div>

            <button
              disabled
              className="w-full py-2.5 rounded-2xl bg-slate-800/50 text-slate-500 font-semibold text-xs border border-slate-800 cursor-default"
            >
              {currentPlan === 'FREE' ? 'Active Plan' : 'Free Tier'}
            </button>
          </div>

          {/* Plan 2: Basic (Most Popular) */}
          <div
            className={`glass-panel rounded-3xl p-6 flex flex-col justify-between relative transition-colors duration-200 border-2 ${
              currentPlan === 'BASIC'
                ? 'border-emerald-500/80 bg-emerald-950/10'
                : 'border-emerald-500/40 hover:border-emerald-500 bg-slate-900/40 shadow-xl shadow-emerald-500/5'
            }`}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  Growth Basic
                </span>
                {currentPlan === 'BASIC' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Current
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-white">$29</span>
                <span className="text-xs text-slate-400">/month</span>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                For growing direct-to-consumer brands that want automated recovery.
              </p>

              <ul className="space-y-3 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Up to 3</strong> Connected Stores</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>5,000</strong> WhatsApp & SMS messages / mo</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Abandoned Cart Recovery sequences</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Order Confirmation & Tracking triggers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>24-Hour Email Support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade('BASIC')}
              disabled={currentPlan === 'BASIC' || upgradingPlan === 'BASIC'}
              className={`w-full py-2.5 rounded-2xl font-bold text-xs transition-colors duration-150 flex items-center justify-center gap-2 shadow-lg ${
                currentPlan === 'BASIC'
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                  : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-emerald-500/20 hover:shadow-emerald-500/30'
              }`}
            >
              {upgradingPlan === 'BASIC' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Redirecting to Stripe...</span>
                </>
              ) : currentPlan === 'BASIC' ? (
                'Current Plan'
              ) : (
                'Upgrade to Basic'
              )}
            </button>
          </div>

          {/* Plan 3: Pro */}
          <div
            className={`glass-panel rounded-3xl p-6 flex flex-col justify-between relative transition-colors duration-200 ${
              currentPlan === 'PRO'
                ? 'border-indigo-500/80 bg-indigo-950/10'
                : 'border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Scale Pro
                </span>
                {currentPlan === 'PRO' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Current
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-white">$79</span>
                <span className="text-xs text-slate-400">/month</span>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                For high-volume multi-store e-commerce agencies & merchants.
              </p>

              <ul className="space-y-3 text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span><strong>Unlimited</strong> Connected Stores</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span><strong>25,000</strong> WhatsApp & SMS messages / mo</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>All triggers + Custom WhatsApp Templates</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>High-Priority BullMQ Queue Routing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Dedicated Slack / WhatsApp Account Manager</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade('PRO')}
              disabled={currentPlan === 'PRO' || upgradingPlan === 'PRO'}
              className={`w-full py-2.5 rounded-2xl font-bold text-xs transition-colors duration-150 flex items-center justify-center gap-2 shadow-lg ${
                currentPlan === 'PRO'
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-indigo-600/20 hover:shadow-indigo-600/30'
              }`}
            >
              {upgradingPlan === 'PRO' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Redirecting to Stripe...</span>
                </>
              ) : currentPlan === 'PRO' ? (
                'Current Plan'
              ) : (
                'Upgrade to Pro'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Security & FAQ Footer */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Enterprise Payment Security</h4>
            <p className="text-xs text-slate-400">
              All transactions are securely handled by Stripe. Credit card details never touch our servers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-400 pt-1">
          <div>
            <strong className="text-slate-200 block mb-1">Can I cancel anytime?</strong>
            <p>Yes. You can cancel or change your plan at any time through the Stripe Customer Billing Portal with zero penalties.</p>
          </div>
          <div>
            <strong className="text-slate-200 block mb-1">Are Meta conversation fees included?</strong>
            <p>Meta charges a small per-conversation utility fee depending on recipient country. Our plans cover the SaaS platform, queue infrastructure, and templates.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingPage;
