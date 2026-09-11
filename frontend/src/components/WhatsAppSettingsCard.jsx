import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient.js';
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
} from 'lucide-react';

export function WhatsAppSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [formData, setFormData] = useState({
    metaPhoneNumberId: '',
    metaBusinessAccountId: '',
    metaAccessToken: '',
    selectedStoreId: '',
  });

  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState('');
  const [isSystemFallback, setIsSystemFallback] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [stores, setStores] = useState([]);

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
        setStores(userStores || []);
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

  // Save WhatsApp settings
  const handleSave = async (e) => {
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

      // Only include token if merchant typed a new one
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

        // Auto-dismiss success toast after 5s
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
              Input and manage your Meta Graph API credentials for automated messaging
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {hasExistingToken ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isSystemFallback ? 'System Env Fallback' : 'Active in Database'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              Credentials Missing
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

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Store Association Dropdown (if multiple stores) */}
        {stores.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target E-Commerce Store
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
              Credentials will apply to webhooks arriving from this store domain.
            </p>
          </div>
        )}

        {/* Phone Number ID & Business Account ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Phone Number ID <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 104827592817293"
              value={formData.metaPhoneNumberId}
              onChange={(e) => setFormData({ ...formData, metaPhoneNumberId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Found in Meta Developer Portal &rarr; WhatsApp &rarr; API Setup
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
              onChange={(e) => setFormData({ ...formData, metaBusinessAccountId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Your Meta WABA identifier for template management
            </p>
          </div>
        </div>

        {/* System User Access Token */}
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
                  ? '•••••••••••••••• (Leave blank to keep existing token)'
                  : 'EAAG... (Paste permanent System User token or temporary test token)'
              }
              value={formData.metaAccessToken}
              onChange={(e) => setFormData({ ...formData, metaAccessToken: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
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
            Permanent token from Meta Business Manager &rarr; System Users with <code className="text-slate-400">whatsapp_business_messaging</code> permission.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Credentials...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Live Physical Phone Test Tool */}
      <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Live WhatsApp Connection Test</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Verify real phone delivery before live order webhooks
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
            How to find your Meta credentials & sandbox allowlist
          </span>
          {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showGuide && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                1
              </span>
              <p>
                Open <strong className="text-white">developers.facebook.com</strong> &rarr; Select your App &rarr; Navigate to <strong className="text-white">WhatsApp &gt; API Setup</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                2
              </span>
              <p>
                Copy your 15-digit <strong className="text-white">Phone number ID</strong> and <strong className="text-white">WhatsApp Business Account ID</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                3
              </span>
              <p>
                <strong className="text-white">Sandbox numbers:</strong> In the "To" field on the API Setup page, add your mobile phone to the allowlist before sending test messages.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                4
              </span>
              <p>
                For permanent tokens, generate a System User token under <strong className="text-white">business.facebook.com &gt; System Users</strong> with <code className="text-emerald-400">whatsapp_business_messaging</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WhatsAppSettingsCard;
