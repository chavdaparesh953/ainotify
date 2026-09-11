import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient.js';
import {
  MessageSquare,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  RefreshCw,
  Store,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function SmsSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');

  const [provider, setProvider] = useState('TWILIO'); // 'TWILIO' | 'FAST2SMS'
  const [senderId, setSenderId] = useState('');

  // Twilio Fields
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioFromNumber, setTwilioFromNumber] = useState('');

  // Fast2SMS Fields
  const [fast2smsApiKey, setFast2smsApiKey] = useState('');

  // Security & Toggles
  const [showToken, setShowToken] = useState(false);
  const [hasExistingCredentials, setHasExistingCredentials] = useState(false);
  const [maskedCreds, setMaskedCreds] = useState({});

  // Feedback Banners
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Test SMS State
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const applyStoreConfig = (store) => {
    const prov = store.smsProvider || 'TWILIO';
    setProvider(prov);
    setSenderId(store.smsSenderId || '');
    setHasExistingCredentials(Boolean(store.hasCredentials));
    setMaskedCreds(store.credentialsMasked || {});

    // Clear uncommitted raw inputs
    setTwilioAccountSid('');
    setTwilioAuthToken('');
    setTwilioFromNumber(store.smsSenderId || '');
    setFast2smsApiKey('');
  };

  // Fetch current SMS settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setSaveError('');
      const res = await axiosClient.get('/settings/sms');
      if (res.data?.success) {
        const { settings, stores: userStores } = res.data;
        setStores(userStores || []);

        const initialStoreId = settings.selectedStoreId || userStores?.[0]?.id || '';
        setSelectedStoreId(initialStoreId);

        const currentStore = userStores?.find((s) => s.id === initialStoreId) || userStores?.[0];

        if (currentStore) {
          applyStoreConfig(currentStore);
        } else {
          setProvider(settings.smsProvider || 'TWILIO');
          setSenderId(settings.smsSenderId || '');
          setHasExistingCredentials(Boolean(settings.hasCredentials));
          setMaskedCreds(settings.credentialsMasked || {});
        }
      }
    } catch (err) {
      console.error('Failed to load SMS settings:', err);
      setSaveError(err.response?.data?.message || 'Failed to load SMS fallback configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle store selector change
  const handleStoreChange = (e) => {
    const storeId = e.target.value;
    setSelectedStoreId(storeId);
    const match = stores.find((s) => s.id === storeId);
    if (match) {
      applyStoreConfig(match);
    }
  };

  // Save SMS settings
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const credentials = {};
      if (provider === 'TWILIO') {
        if (twilioAccountSid) credentials.accountSid = twilioAccountSid;
        if (twilioAuthToken) credentials.authToken = twilioAuthToken;
        if (twilioFromNumber) credentials.fromNumber = twilioFromNumber;
      } else if (provider === 'FAST2SMS') {
        if (fast2smsApiKey) credentials.apiKey = fast2smsApiKey;
        if (senderId) credentials.senderId = senderId;
      }

      const res = await axiosClient.put('/settings/sms', {
        storeId: selectedStoreId,
        smsProvider: provider,
        smsCredentials: Object.keys(credentials).length > 0 ? credentials : undefined,
        smsSenderId: provider === 'TWILIO' ? twilioFromNumber || senderId : senderId,
      });

      if (res.data?.success) {
        setSaveSuccess(`SMS Fallback provider (${provider}) saved successfully!`);
        setHasExistingCredentials(res.data.store?.hasCredentials);
        setMaskedCreds(res.data.store?.credentialsMasked || {});
        // Update local stores array
        setStores((prev) =>
          prev.map((s) => (s.id === selectedStoreId ? { ...s, ...res.data.store } : s))
        );
      }
    } catch (err) {
      console.error('Failed to save SMS settings:', err);
      setSaveError(err.response?.data?.message || 'Failed to save SMS configuration.');
    } finally {
      setSaving(false);
    }
  };

  // Test SMS connection ping
  const handleTestSms = async (e) => {
    e.preventDefault();
    if (!testPhone) return;

    setTesting(true);
    setTestResult(null);

    try {
      const res = await axiosClient.post('/settings/sms/test', {
        storeId: selectedStoreId,
        smsProvider: provider,
        testPhone,
        testMessage: testMessage || undefined,
      });

      if (res.data?.success) {
        setTestResult({
          success: true,
          message: res.data.message || 'Test SMS sent successfully!',
          messageId: res.data.messageId,
          provider: res.data.provider,
          to: res.data.to,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Failed to send test SMS.',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-8 flex items-center justify-center space-x-3 text-slate-400 min-h-[400px]">
        <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
        <span className="text-sm">Loading SMS Fallback configuration...</span>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/5">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                SMS Fallback Integration
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Step 19
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically deliver notifications via SMS whenever a customer cannot receive WhatsApp messages.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {hasExistingCredentials ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{provider} Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>No SMS Credentials</span>
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Selector */}
        {stores.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Select Target Store</span>
            </label>
            <select
              value={selectedStoreId}
              onChange={handleStoreChange}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.storeUrl} ({s.platform}) {s.smsProvider ? `• ${s.smsProvider}` : '• No SMS'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider">
            SMS Gateway Provider
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setProvider('TWILIO')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                provider === 'TWILIO'
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span className="text-sm font-bold">Twilio</span>
              <span className="text-[11px] text-slate-400 mt-1">Global SMS & Alphanumeric Senders</span>
            </button>

            <button
              type="button"
              onClick={() => setProvider('FAST2SMS')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                provider === 'FAST2SMS'
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span className="text-sm font-bold">Fast2SMS</span>
              <span className="text-[11px] text-slate-400 mt-1">India DLT & Quick Route SMS</span>
            </button>
          </div>
        </div>

        {/* Provider Specific Credential Inputs */}
        {provider === 'TWILIO' ? (
          <div className="space-y-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-cyan-400" /> Twilio API Credentials
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account SID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Twilio Account SID
                </label>
                <input
                  type="text"
                  value={twilioAccountSid}
                  onChange={(e) => setTwilioAccountSid(e.target.value)}
                  placeholder={maskedCreds.accountSid || 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Auth Token */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Twilio Auth Token
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-[11px] text-slate-400 hover:text-slate-300 flex items-center gap-1"
                  >
                    {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showToken ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={twilioAuthToken}
                  onChange={(e) => setTwilioAuthToken(e.target.value)}
                  placeholder={hasExistingCredentials ? '••••••••••••••••' : 'Enter Twilio Auth Token'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Twilio From Number / Sender ID */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300">
                  Twilio Phone Number / Sender ID
                </label>
                <input
                  type="text"
                  value={twilioFromNumber}
                  onChange={(e) => setTwilioFromNumber(e.target.value)}
                  placeholder={maskedCreds.fromNumber || '+12055550199 or WaNotify'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <p className="text-[11px] text-slate-500">
                  Must be a purchased Twilio E.164 phone number (e.g. +12055550199) or verified Alphanumeric Sender ID.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-cyan-400" /> Fast2SMS API Credentials
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Authorization API Key */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Fast2SMS API Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-[11px] text-slate-400 hover:text-slate-300 flex items-center gap-1"
                  >
                    {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showToken ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={fast2smsApiKey}
                  onChange={(e) => setFast2smsApiKey(e.target.value)}
                  placeholder={hasExistingCredentials ? maskedCreds.apiKey || '••••••••••••••••' : 'Enter Fast2SMS Authorization Key'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Sender ID */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300">
                  Sender ID (Optional for DLT)
                </label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  placeholder={maskedCreds.senderId || 'e.g. FSTSMS or 6-character DLT ID'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <p className="text-[11px] text-slate-500">
                  Leave blank to use Fast2SMS default Quick SMS route.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>{saving ? 'Saving...' : 'Save SMS Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Live Test SMS Ping Sub-Section */}
      <div className="pt-6 border-t border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Send className="w-4 h-4 text-cyan-400" />
            <span>Live SMS Connection Test</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Verify real phone delivery before live order fallbacks
          </span>
        </div>

        <form onSubmit={handleTestSms} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <input
              type="text"
              required
              placeholder="Your Phone: e.g. +1234567890 or 9876543210"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="sm:col-span-3">
            <input
              type="text"
              placeholder="Custom Message (Optional)"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={testing || !testPhone}
              className="w-full px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Send Test SMS</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-4 rounded-2xl text-xs space-y-1 ${
              testResult.success
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
            {testResult.messageId && (
              <p className="text-[11px] font-mono text-emerald-400/90 pl-6">
                Provider Message ID: {testResult.messageId} ({testResult.provider})
              </p>
            )}
          </div>
        )}
      </div>

      {/* Setup Guide Collapsible Toggle */}
      <div className="pt-2 border-t border-slate-800/60">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
        >
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>How does SMS Fallback work with WhatsApp?</span>
          </span>
          {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showGuide && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2.5">
            <p className="leading-relaxed">
              When Meta WhatsApp returns error code <code className="text-cyan-300 font-mono">131026</code> (User not on WhatsApp), WaNotify automatically catches the failure.
            </p>
            <p className="leading-relaxed">
              If <strong className="text-white">Fallback to SMS</strong> is enabled on the automation rule, the worker strips WhatsApp formatting (like <code className="text-slate-400 font-mono">*bold*</code> and <code className="text-slate-400 font-mono">_italic_</code>) into clean text and delivers it via your chosen SMS gateway.
            </p>
            <p className="leading-relaxed text-slate-400">
              The message is logged in PostgreSQL with status <code className="text-cyan-300 font-mono">SMS_FALLBACK</code>, and you can view it on your Overview and Message Logs dashboards.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SmsSettingsCard;
