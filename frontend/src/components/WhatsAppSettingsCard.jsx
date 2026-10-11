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
  Building2,
  Check,
  Info,
} from 'lucide-react';

export function WhatsAppSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectingEmbedded, setConnectingEmbedded] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Tab mode when disconnected: 'manual' (Direct fields) or 'embedded' (1-Click Facebook)
  const [connectMode, setConnectMode] = useState('manual');

  const [formData, setFormData] = useState({
    metaPhoneNumberId: '',
    metaBusinessAccountId: '',
    metaAccessToken: '',
    selectedStoreId: '',
  });

  const [metaAppId, setMetaAppId] = useState('');
  const [metaConfigId, setMetaConfigId] = useState('');
  const [isEmbeddedConfigured, setIsEmbeddedConfigured] = useState(false);

  // Meta App Credentials Form (to save App ID & Secret from UI)
  const [metaAppForm, setMetaAppForm] = useState({
    appId: '',
    appSecret: '',
    configId: '',
  });
  const [savingAppCredentials, setSavingAppCredentials] = useState(false);
  const [showAppSecret, setShowAppSecret] = useState(false);

  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState('');
  const [isSystemFallback, setIsSystemFallback] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [stores, setStores] = useState([]);
  const [showManualEdit, setShowManualEdit] = useState(false);

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
        setMetaAppForm({
          appId: settings.metaAppId || '',
          appSecret: '',
          configId: settings.metaConfigId || '',
        });
        setStores(userStores || []);

        // Default tab: if App ID is configured, show 1-Click; otherwise show manual fields directly!
        if (settings.isEmbeddedConfigured && settings.metaAppId) {
          setConnectMode('embedded');
        } else {
          setConnectMode('manual');
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
      setSaveError('Please enter your Meta App ID below to enable 1-Click Facebook login.');
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

  // Save Meta App Credentials (App ID & Secret) directly from UI
  const handleSaveAppCredentials = async (e) => {
    e.preventDefault();
    setSavingAppCredentials(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const res = await axiosClient.post('/settings/whatsapp/meta-app', {
        metaAppId: metaAppForm.appId.trim(),
        metaAppSecret: metaAppForm.appSecret.trim() || undefined,
        metaConfigId: metaAppForm.configId.trim() || undefined,
      });

      if (res.data?.success) {
        setMetaAppId(res.data.settings.metaAppId);
        setMetaConfigId(res.data.settings.metaConfigId || '');
        setIsEmbeddedConfigured(Boolean(res.data.settings.isEmbeddedConfigured));
        setSaveSuccess(res.data.message || 'Meta App configured! You can now use 1-Click Facebook login.');
        setTimeout(() => setSaveSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Failed to save Meta App credentials:', err);
      setSaveError(err.response?.data?.message || 'Failed to save Meta App credentials.');
    } finally {
      setSavingAppCredentials(false);
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

  // Save manual WhatsApp credentials
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
              1-Click Meta Embedded Signup or direct credentials setup for e-commerce store automations
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <span>Active E-Commerce Store</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                  {stores.find((s) => s.id === formData.selectedStoreId)?.platform || 'STORE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                WhatsApp credentials link directly to webhooks arriving from this store domain
              </p>
            </div>
          </div>
          <select
            value={formData.selectedStoreId}
            onChange={handleStoreChange}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.storeUrl} ({s.platform})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCENARIO A: WHATSAPP IS ALREADY CONNECTED                                 */}
      {/* ========================================================================= */}
      {hasExistingToken ? (
        <div className="space-y-5">
          {/* Active Connected Hero Card */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 p-6 sm:p-7 shadow-xl space-y-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Top Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2 max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  WhatsApp Active & Synced
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  WhatsApp Cloud API Connected
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your WhatsApp Business Account is actively linked. Order confirmations, COD verifications, and abandoned cart alerts are delivering via Cloud API.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                <button
                  type="button"
                  onClick={handleConnectEmbedded}
                  disabled={connectingEmbedded}
                  className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/90 active:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs whitespace-nowrap transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
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
                  className="h-10 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/30 text-rose-300 hover:text-rose-200 font-semibold text-xs whitespace-nowrap transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {disconnecting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                  ) : (
                    <Unlink className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>Disconnect</span>
                </button>
              </div>
            </div>

            {/* Bottom Row: Full-Width 3-Box Credentials Grid */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3.5 relative z-10">
              {/* Box 1: Phone Number ID */}
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-inner">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block whitespace-nowrap">
                    Phone Number ID
                  </span>
                  <span className="text-sm font-mono font-semibold text-emerald-400 block truncate mt-1">
                    {formData.metaPhoneNumberId || '—'}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>

              {/* Box 2: WABA Account ID */}
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-inner">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block whitespace-nowrap">
                    WABA Account ID
                  </span>
                  <span className="text-sm font-mono font-semibold text-slate-200 block truncate mt-1">
                    {formData.metaBusinessAccountId || '—'}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>

              {/* Box 3: Meta Access Token */}
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-inner">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block whitespace-nowrap">
                    Meta Access Token
                  </span>
                  <span className="text-sm font-mono font-medium text-slate-300 block truncate mt-1">
                    {maskedToken || '—'}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Optional Accordion to edit manual configuration */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowManualEdit(!showManualEdit)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs font-bold text-slate-200">
                    Modify Credentials Manually
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Update your Phone ID, WABA ID, or paste a new permanent System User token
                  </p>
                </div>
              </div>
              <div className="text-slate-400">
                {showManualEdit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showManualEdit && (
              <div className="p-5 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-200">
                <form onSubmit={handleSaveManual} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Phone Number ID <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1120304537843330"
                        value={formData.metaPhoneNumberId}
                        onChange={(e) => setFormData({ ...formData, metaPhoneNumberId: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        WhatsApp Business Account ID (WABA)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 4121906794767456"
                        value={formData.metaBusinessAccountId}
                        onChange={(e) => setFormData({ ...formData, metaBusinessAccountId: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      New Meta Graph API Access Token (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep existing token, or paste new EAAG..."
                      value={formData.metaAccessToken}
                      onChange={(e) => setFormData({ ...formData, metaAccessToken: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* SCENARIO B: WHATSAPP IS NOT CONNECTED (DIRECT VISIBLE FIELDS!)            */
        /* ========================================================================= */
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-7 space-y-6 shadow-xl">
          {/* Mode Switcher Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>Connect Your WhatsApp Account</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose how you want to add your WhatsApp credentials to WaNotify
              </p>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="inline-flex p-1 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setConnectMode('manual');
                  setSaveError('');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                  connectMode === 'manual'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="whitespace-nowrap">Enter Credentials Directly</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setConnectMode('embedded');
                  setSaveError('');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                  connectMode === 'embedded'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="whitespace-nowrap">1-Click Facebook Login</span>
              </button>
            </div>
          </div>

          {/* TAB 1: DIRECT API CREDENTIALS FORM (PROMINENT & OPEN BY DEFAULT) */}
          {connectMode === 'manual' && (
            <form onSubmit={handleSaveManual} className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your Meta Cloud API details below. You can find these in your{' '}
                  <a
                    href="https://developers.facebook.com/apps/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    Meta for Developers Dashboard <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  under WhatsApp &rarr; API Setup.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field 1: Phone Number ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <span>Phone Number ID</span>
                    <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1120304537843330"
                    value={formData.metaPhoneNumberId}
                    onChange={(e) => setFormData({ ...formData, metaPhoneNumberId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-colors"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    15–16 digit ID from WhatsApp &rarr; API Setup &rarr; Step 1
                  </p>
                </div>

                {/* Field 2: WABA Account ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <span>WhatsApp Business Account ID (WABA)</span>
                    <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4121906794767456"
                    value={formData.metaBusinessAccountId}
                    onChange={(e) => setFormData({ ...formData, metaBusinessAccountId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-colors"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Your WABA identifier for template management
                  </p>
                </div>
              </div>

              {/* Field 3: Meta Access Token */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Meta Graph API Access Token</span>
                    <span className="text-emerald-400">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    required
                    placeholder="EAAG... (Paste permanent System User token or temporary test token)"
                    value={formData.metaAccessToken}
                    onChange={(e) => setFormData({ ...formData, metaAccessToken: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-colors"
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
                  System User token generated from Meta Business Manager with <code className="text-emerald-400 font-mono">whatsapp_business_messaging</code> permission
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || !formData.metaPhoneNumberId || !formData.metaAccessToken}
                  className="h-11 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving & Connecting...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Save Credentials & Connect WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: 1-CLICK FACEBOOK LOGIN */}
          {connectMode === 'embedded' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {metaAppId ? (
                /* Ready State: Meta App ID is configured, show 1-Click Button */
                <div className="p-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="space-y-1.5 max-w-lg">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Sparkles className="w-3 h-3" />
                      Meta App Ready (App ID: {metaAppId})
                    </span>
                    <h5 className="text-base font-bold text-white">
                      Connect via Meta Facebook Popup
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Click below to log in with your Facebook account, select your WhatsApp number, and verify via OTP in under 2 minutes.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectEmbedded}
                    disabled={connectingEmbedded}
                    className="h-12 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:from-emerald-600 active:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 whitespace-nowrap transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 group shrink-0"
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
                </div>
              ) : (
                /* Unconfigured State: Direct Fields to enter Meta App ID & Secret right here! */
                <form onSubmit={handleSaveAppCredentials} className="p-6 rounded-2xl border border-teal-500/20 bg-slate-950/70 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">
                        Enter Your Meta Developer App Credentials
                      </h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        To enable the 1-Click Facebook Popup for your store, enter your Meta App ID & Secret once below:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <span>Meta App ID</span>
                        <span className="text-teal-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 104827592817293"
                        value={metaAppForm.appId}
                        onChange={(e) => setMetaAppForm({ ...metaAppForm, appId: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono transition-colors"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">From Meta for Developers &rarr; App Settings &rarr; Basic</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <span>Meta App Secret</span>
                          <span className="text-teal-400">*</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type={showAppSecret ? 'text' : 'password'}
                          required
                          placeholder="e.g. 3b8f1a2c4e5d6f..."
                          value={metaAppForm.appSecret}
                          onChange={(e) => setMetaAppForm({ ...metaAppForm, appSecret: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAppSecret(!showAppSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        >
                          {showAppSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">App Secret from Meta Developer Dashboard</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setConnectMode('manual')}
                      className="text-xs text-slate-400 hover:text-teal-300 transition-colors"
                    >
                      &larr; Prefer to enter Phone ID & Token directly instead?
                    </button>

                    <button
                      type="submit"
                      disabled={savingAppCredentials || !metaAppForm.appId.trim()}
                      className="h-10 px-5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingAppCredentials ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving App...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save & Activate 1-Click Login</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

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
                <strong className="text-white">Direct Credentials vs 1-Click Login:</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  You can either enter your Phone Number ID and permanent System User Token directly, or connect in 1-Click with Facebook Login popup.
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
