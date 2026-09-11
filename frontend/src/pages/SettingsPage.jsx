import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Shield, Key, Bell, ExternalLink, Smartphone, Server, MessageSquare } from 'lucide-react';
import WhatsAppSettingsCard from '../components/WhatsAppSettingsCard.jsx';
import SmsSettingsCard from '../components/SmsSettingsCard.jsx';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp' | 'sms'

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Account & Channel Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your merchant profile, WhatsApp Meta Cloud credentials, and automated SMS fallback channels.
        </p>
      </div>

      {/* Channel Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'whatsapp'
              ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>WhatsApp Cloud API</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sms')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'sms'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>SMS Fallback (Twilio & Fast2SMS)</span>
        </button>
      </div>

      {/* Active Channel Settings Cards */}
      <div className={activeTab === 'whatsapp' ? 'block' : 'hidden'}>
        <WhatsAppSettingsCard />
      </div>

      <div className={activeTab === 'sms' ? 'block' : 'hidden'}>
        <SmsSettingsCard />
      </div>

      {/* Merchant Profile Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Merchant Account</h3>
            <p className="text-xs text-slate-400">Authenticated user profile and subscription tier</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block mb-1">Email Address</span>
            <span className="text-sm font-semibold text-white">{user?.email || 'merchant@store.com'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block mb-1">Subscription Tier</span>
            <span className="text-sm font-semibold text-emerald-400">
              {user?.subscriptionStatus || 'TRIAL'} PLAN
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 sm:col-span-2">
            <span className="text-slate-400 block mb-1">Merchant User UUID</span>
            <span className="text-xs font-mono text-slate-300 break-all">{user?.id || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Security & System Architecture Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">WaNotify Engine Architecture</h3>
            <p className="text-xs text-slate-400">Backend queue and security mechanisms</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <p className="leading-relaxed">
            WaNotify SaaS dispatches template notifications using Meta's official Graph API v17.0.
            Your WhatsApp Business Account credentials are encrypted and securely routed through our decoupled BullMQ Redis background worker.
          </p>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Meta API Version:</span>
              <span className="font-mono text-white">v17.0 (LTS)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Template Engine:</span>
              <span className="text-emerald-400 font-semibold">Active (order_confirmation, abandoned_cart_recovery)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">HMAC Cryptographic Verification:</span>
              <span className="text-emerald-400 font-semibold">SHA-256 Enforced</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Queue Processing Concurrency:</span>
              <span className="font-mono text-emerald-400">10 Parallel Workers (BullMQ)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
