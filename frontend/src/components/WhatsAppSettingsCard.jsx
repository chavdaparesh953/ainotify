import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient.js';
import { launchWhatsAppSignup } from '../utils/facebookSdk.js';
import {
  Smartphone,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  RefreshCw,
  Store,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Sparkles,
  Unlink,
  Check,
  Info,
} from 'lucide-react';

export function WhatsAppSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectingEmbedded, setConnectingEmbedded] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [formData, setFormData] = useState({
    metaPhoneNumberId: '',
    metaBusinessAccountId: '',
    metaAccessToken: '',
    selectedStoreId: '',
  });

  const [metaAppId, setMetaAppId] = useState('');
  const [metaConfigId, setMetaConfigId] = useState('');
  const [isEmbeddedConfigured, setIsEmbeddedConfigured] = useState(false);

  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState('');
  const [isSystemFallback, setIsSystemFallback] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [stores, setStores] = useState([]);
  const [showManualSetup, setShowManualSetup] = useState(false);

  // Notification banners
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Live test state
  const [testPhone, setTestPhone] = useState('');
  const [testTemplate, setTestTemplate] = useState('hello_world');
  const [testResult, setTestResult] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setSaveError('');
      const res = await axiosClient.get('/settings/whatsapp');
      if (res.data?.success) {
        const { settings, stores: userStores } = res.data;
        setFormData({
          metaPhoneNumberId: settings.metaPhoneNumberId || '',
          metaBusinessAccountId: settings.metaBusinessAccountId || '',
          metaAccessToken: '',
          selectedStoreId: settings.selectedStoreId || userStores?.[0]?.id || '',
        });
        setHasExistingToken(Boolean(settings.hasMetaAccessToken));
        setMaskedToken(settings.metaAccessTokenMasked || '');
        setIsSystemFallback(Boolean(settings.isSystemFallback));
        setMetaAppId(settings.metaAppId || '');
        setMetaConfigId(settings.metaConfigId || '');
        setIsEmbeddedConfigured(Boolean(settings.isEmbeddedConfigured));
        setStores(userStores || []);

        // If not connected, default show manual toggle collapsed but ready
        if (!settings.hasMetaAccessToken) {
          setShowManualSetup(false);
        }
      }
    } catch (err) {
      console.error('Failed to load WhatsApp settings:', err);
      setSaveError(err.response?.data?.message || 'Failed to load WhatsApp configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle store selection change
  const handleStoreChange = (e) => {
    const storeId = e.target.value;
    setFormData((prev) => ({ ...prev, selectedStoreId: storeId }));
    const match = stores.find((s) => s.id === storeId);
    if (match) {
      setFormData((prev) => ({
        ...prev,
        metaPhoneNumberId: match.metaPhoneNumberId || prev.metaPhoneNumberId,
        metaBusinessAccountId: match.metaBusinessAccountId || prev.metaBusinessAccountId,
      }));
      if (match.hasMetaAccessToken) {
        setHasExistingToken(true);
        setMaskedToken(match.metaAccessTokenMasked || '');
      }
    }
  };

  // 1-Click Meta WhatsApp Embedded Signup handler
  const handleConnectEmbedded = async () => {
    setSaveError('');
    setSaveSuccess('');

    if (!metaAppId) {
      setSaveError(
        'Meta App ID is not configured in backend .env (META_APP_ID). Please configure your Meta App credentials, or use the "Advanced / Developer Manual Setup" option below.'
      );
      setShowManualSetup(true);
      return;
    }

    setConnectingEmbedded(true);

    try {
      // 1. Launch Meta's popup modal
      const signupResult = await launchWhatsAppSignup({
        appId: metaAppId,
        configId: metaConfigId || undefined,
      });

      // 2. Transmit returned code/token to SaaS backend for token exchange & database update
      const res = await axiosClient.post('/settings/whatsapp/embedded-signup', {
        code: signupResult.code,
        accessToken: signupResult.accessToken,
        wabaId: signupResult.wabaId,
        phoneNumberId: signupResult.phoneNumberId,
        storeId: formData.selectedStoreId || undefined,
      });

      if (res.data?.success) {
        const { settings } = res.data;
        setSaveSuccess(
          res.data.message || 'WhatsApp Business Account successfully connected in 1-Click!'
        );
        setHasExistingToken(true);
        setMaskedToken(settings.metaAccessTokenMasked || '');
        setFormData((prev) => ({
          ...prev,
          metaPhoneNumberId: settings.metaPhoneNumberId || prev.metaPhoneNumberId,
          metaBusinessAccountId: settings.metaBusinessAccountId || prev.metaBusinessAccountId,
          metaAccessToken: '',
        }));
        setIsSystemFallback(false);

        // Auto-dismiss notification after 6s
        setTimeout(() => setSaveSuccess(''), 6000);
      }
    } catch (err) {
      console.error('1-Click WhatsApp Onboarding error:', err);
      setSaveError(
        err.response?.data?.message ||
          err.message ||
          'Failed to complete WhatsApp Embedded Signup. Please try again.'
      );
    } finally {
      setConnectingEmbedded(false);
    }
  };

  // Disconnect WhatsApp configuration
  const handleDisconnect = async () => {
    const confirmDisconnect = window.confirm(
      'Are you sure you want to disconnect WhatsApp? Automated order messages and COD notifications will pause until reconnected.'
    );
    if (!confirmDisconnect) return;

    setDisconnecting(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const res = await axiosClient.post('/settings/whatsapp/disconnect', {
        storeId: formData.selectedStoreId || undefined,
      });

      if (res.data?.success) {
        setHasExistingToken(false);
        setMaskedToken('');
        setFormData((prev) => ({
          ...prev,
          metaPhoneNumberId: '',
          metaBusinessAccountId: '',
          metaAccessToken: '',
        }));
        setSaveSuccess('WhatsApp disconnected successfully.');
        setTimeout(() => setSaveSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Failed to disconnect WhatsApp:', err);
      setSaveError(err.response?.data?.message || 'Failed to disconnect WhatsApp configuration.');
    } finally {
      setDisconnecting(false);
    }
  };

  // Save manual WhatsApp settings
  const handleSaveManual = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const payload = {
        metaPhoneNumberId: formData.metaPhoneNumberId,
        metaBusinessAccountId: formData.metaBusinessAccountId,
        storeId: formData.selectedStoreId || undefined,
      };

      if (formData.metaAccessToken.trim()) {
        payload.metaAccessToken = formData.metaAccessToken.trim();
      }

      const res = await axiosClient.put('/settings/whatsapp', payload);
      if (res.data?.success) {
        setSaveSuccess(res.data.message || 'WhatsApp configuration saved successfully!');
        setFormData((prev) => ({ ...prev, metaAccessToken: '' }));
        setHasExistingToken(Boolean(res.data.settings.hasMetaAccessToken));
        setMaskedToken(res.data.settings.metaAccessTokenMasked || '');
        setIsSystemFallback(false);

        setTimeout(() => setSaveSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveError(err.response?.data?.message || 'Failed to update WhatsApp settings.');
    } finally {
      setSaving(false);
    }
  };

  // Test live message
  const handleTestMessage = async () => {
    if (!testPhone.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter a test phone number with country code (e.g., +919876543210).',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await axiosClient.post('/settings/whatsapp/test', {
        recipientPhone: testPhone.trim(),
        templateName: testTemplate,
        metaPhoneNumberId: formData.metaPhoneNumberId.trim() || undefined,
        metaAccessToken: formData.metaAccessToken.trim() || undefined,
      });

      setTestResult({
        success: true,
        message: res.data?.message || 'Test message sent successfully!',
        messageId: res.data?.messageId,
        recipient: res.data?.recipient,
      });
    } catch (err) {
      console.error('Test message failed:', err);
      const data = err.response?.data || {};
      setTestResult({
        success: false,
        message: data.message || 'Failed to send test message to Meta API.',
        errorCode: data.errorCode,
        details: data.details,
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-8 flex items-center justify-center space-x-3 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span className="text-sm">Loading WhatsApp Cloud API settings...</span>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/5">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              WhatsApp Cloud API Configuration
            </h3>
            <p className="text-xs text-slate-400">
              1-Click Meta Embedded Signup or manual token setup for e-commerce store automations
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {hasExistingToken ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isSystemFallback ? 'System Env Fallback' : 'Active & Connected'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              WhatsApp Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Store Association Dropdown (if multiple stores) */}
      {stores.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target E-Commerce Store</span>
          </label>
          <div className="relative">
            <select
              value={formData.selectedStoreId}
              onChange={handleStoreChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.storeUrl} ({s.platform})
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            WhatsApp credentials will link to webhooks dispatched by this store domain.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1-CLICK EMBEDDED SIGNUP HERO CARD                                         */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                1-Click Setup • Recommended
              </span>
              {hasExistingToken && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Synced
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-white">
              {hasExistingToken
                ? 'WhatsApp Cloud API is Connected & Ready'
                : 'Connect WhatsApp with Facebook in 1-Click'}
            </h4>

            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              {hasExistingToken
                ? 'Your WhatsApp Business Account is linked to WaNotify. Order confirmations, COD verifications, and abandoned carts will dispatch automatically.'
                : 'No technical Meta Developer setup needed. Click below to log in with Facebook, verify your store phone number via OTP, and auto-generate permanent credentials in under 2 minutes.'}
            </p>

            {hasExistingToken && (
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-300">
                {formData.metaPhoneNumberId && (
                  <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
                    <span className="text-slate-500 text-[11px]">Phone ID:</span>
                    <span className="text-emerald-400 font-semibold">{formData.metaPhoneNumberId}</span>
                  </div>
                )}
                {formData.metaBusinessAccountId && (
                  <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
                    <span className="text-slate-500 text-[11px]">WABA ID:</span>
                    <span className="text-slate-300">{formData.metaBusinessAccountId}</span>
                  </div>
                )}
                {maskedToken && (
                  <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
                    <span className="text-slate-500 text-[11px]">Token:</span>
                    <span className="text-slate-400">{maskedToken}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {hasExistingToken ? (
              <>
                <button
                  type="button"
                  onClick={handleConnectEmbedded}
                  disabled={connectingEmbedded}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  title="Switch to another WhatsApp number or reconnect"
                >
                  {connectingEmbedded ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Re-connect / Switch</span>
                </button>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {disconnecting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                  ) : (
                    <Unlink className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectEmbedded}
                disabled={connectingEmbedded}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:from-emerald-600 active:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 group"
              >
                {connectingEmbedded ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Connecting with Meta...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950 group-hover:scale-110 transition-transform" />
                    <span>Connect WhatsApp with Facebook</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADVANCED / DEVELOPER MANUAL CONFIGURATION (ACCORDION)                    */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowManualSetup(!showManualSetup)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-xs font-bold text-slate-200">
                Advanced / Developer Manual Configuration
              </span>
              <p className="text-[11px] text-slate-500">
                Manually enter custom System User Tokens, Sandbox IDs, or manage developer bypass
              </p>
            </div>
          </div>
          <div className="text-slate-400">
            {showManualSetup ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {showManualSetup && (
          <div className="p-5 border-t border-slate-800/80 space-y-5 animate-in fade-in duration-200">
            <form onSubmit={handleSaveManual} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number ID <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 104827592817293"
                    value={formData.metaPhoneNumberId}
                    onChange={(e) =>
                      setFormData({ ...formData, metaPhoneNumberId: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    From Meta Developer Portal &rarr; WhatsApp &rarr; API Setup
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    WhatsApp Business Account ID (WABA)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 103948572619482"
                    value={formData.metaBusinessAccountId}
                    onChange={(e) =>
                      setFormData({ ...formData, metaBusinessAccountId: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Meta WABA identifier for template management
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Meta Graph API Access Token <span className="text-emerald-400">*</span>
                  </label>
                  {hasExistingToken && (
                    <span className="text-[11px] text-emerald-400 font-mono">
                      Saved: {maskedToken}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    placeholder={
                      hasExistingToken
                        ? '•••••••••••••••• (Leave blank to preserve active token)'
                        : 'EAAG... (Paste permanent System User token)'
                    }
                    value={formData.metaAccessToken}
                    onChange={(e) =>
                      setFormData({ ...formData, metaAccessToken: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Permanent token from Meta Business Manager &rarr; System Users with{' '}
                  <code className="text-slate-400">whatsapp_business_messaging</code> permission.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Manual Config...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Save Manual Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* LIVE PHYSICAL PHONE TEST TOOL                                             */}
      {/* ========================================================================= */}
      <div className="pt-4 border-t border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Live WhatsApp Connection Test</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Verify real phone delivery before order automation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <input
              type="text"
              placeholder="Your Phone: e.g. +919876543210"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={testTemplate}
              onChange={(e) => setTestTemplate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="hello_world">hello_world (Sandbox Instant)</option>
              <option value="order_confirmation">order_confirmation</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={handleTestMessage}
              disabled={testing || (!hasExistingToken && !formData.metaAccessToken)}
              className="w-full px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Send Test Ping</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-4 rounded-2xl text-xs space-y-1 animate-in fade-in ${
              testResult.success
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
            {testResult.messageId && (
              <p className="text-[11px] font-mono text-emerald-400/90 pl-6">
                Meta Message ID: {testResult.messageId}
              </p>
            )}
            {testResult.errorCode && (
              <p className="text-[11px] text-red-400 pl-6">
                Meta Error Code: {testResult.errorCode}
                {testResult.errorCode === 190 && ' (Invalid or expired token)'}
                {testResult.errorCode === 131030 && ' (Number not added to Sandbox Allowlist)'}
                {testResult.errorCode === 132001 && ' (Template not approved yet)'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Meta Setup Guide Toggle */}
      <div className="pt-2 border-t border-slate-800/60">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            How 1-Click Embedded Signup & Meta Cloud API work
          </span>
          {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showGuide && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-white">1-Click Embedded Signup (Recommended):</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Click the "Connect WhatsApp with Facebook" button. A Meta popup will guide you to select your business and verify your phone number via OTP. Our backend automatically exchanges the token and hooks webhook deliveries.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-white">Template Approval in Meta Manager:</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Ensure you create the <code className="text-emerald-400">order_confirmation</code> utility template in your Meta WhatsApp Manager so high-speed notifications can be delivered.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Meta WhatsApp Manager:</span>
              <a
                href="https://business.facebook.com/wa/manage/message-templates/"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Open Templates Manager</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WhatsAppSettingsCard;
