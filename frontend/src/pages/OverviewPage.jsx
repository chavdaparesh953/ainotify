import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import StatCard from '../components/StatCard.jsx';
import ConnectStoreModal from '../components/ConnectStoreModal.jsx';
import AnalyticsChart from '../components/AnalyticsChart.jsx';
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Radio,
  ShoppingCart,
  Smartphone,
} from 'lucide-react';

export function OverviewPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/dashboard/stats');
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getWebhookReceiveUrl = () => {
    const rawApi = import.meta.env.VITE_API_BASE_URL;
    if (rawApi) {
      return `${rawApi.replace(/\/+$/, '')}/api/webhooks/receive`;
    }
    return `${window.location.origin}/api/webhooks/receive`;
  };

  const webhookReceiveUrl = getWebhookReceiveUrl();

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookReceiveUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Automation Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time analytics across your connected Shopify and WooCommerce stores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsStoreModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Store</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
        <StatCard
          title="Total Messages"
          value={isLoading ? '...' : (stats?.totalMessages ?? 0).toLocaleString()}
          subtitle="Processed through BullMQ"
          icon={MessageSquare}
          color="indigo"
          badge="Live"
        />

        <StatCard
          title="Delivery Rate"
          value={isLoading ? '...' : stats?.deliveryRate ?? '0.00%'}
          subtitle="Successful transmissions"
          icon={CheckCircle}
          color="emerald"
          badge="Target >95%"
        />

        <StatCard
          title="Recovered Checkouts"
          value={isLoading ? '...' : (stats?.recoveredCheckouts ?? 0).toLocaleString()}
          subtitle="Abandoned carts saved"
          icon={ShoppingCart}
          color="teal"
          badge={stats?.recoveredOrganically ? `${stats.recoveredOrganically} Organic` : 'Cart Recovery'}
        />

        <StatCard
          title="SMS Fallback"
          value={isLoading ? '...' : (stats?.smsFallback ?? 0).toLocaleString()}
          subtitle="Triggered on Meta 131026"
          icon={Smartphone}
          color="cyan"
          badge="Multi-Channel"
        />

        <StatCard
          title="Failed Messages"
          value={isLoading ? '...' : (stats?.failed ?? 0).toLocaleString()}
          subtitle="Undeliverable or API rejected"
          icon={XCircle}
          color="rose"
          badge={stats?.failed > 0 ? 'Requires attention' : 'Zero errors'}
        />

        <StatCard
          title="Connected Stores"
          value={isLoading ? '...' : (stats?.totalStores ?? 0).toLocaleString()}
          subtitle="Shopify & WooCommerce"
          icon={Store}
          color="amber"
          badge="Active Sync"
        />
      </div>

      {/* 7-Day Visual Analytics Trend Chart */}
      <AnalyticsChart chartData={stats?.chartData} isLoading={isLoading} />

      {/* Quick Action / Webhook Ingestion Banner */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Generic Webhook Gateway</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Ingest Shopify & WooCommerce Webhooks
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Configure this universal endpoint in your Shopify notifications or WooCommerce Webhooks settings.
              Requests are validated with HMAC-SHA256 and queued instantly.
            </p>
          </div>

          {/* Webhook URL Copy Capsule */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="font-mono text-xs text-emerald-400 select-all break-all sm:break-normal">
              {webhookReceiveUrl}
            </div>
            <button
              onClick={handleCopyWebhookUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors shrink-0"
            >
              {copiedWebhook ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy URL</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Architecture Flow Visualization */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Pipeline Architecture</h3>
            <p className="text-xs text-slate-400">How your e-commerce events flow through the SaaS engine</p>
          </div>
          <Link
            to="/dashboard/logs"
            className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
          >
            <span>View Message Activity</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Step 1</div>
            <h4 className="text-sm font-semibold text-white">Order Placed</h4>
            <p className="text-xs text-slate-400 mt-1">Shopify or WooCommerce dispatches raw JSON payload.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Step 2</div>
            <h4 className="text-sm font-semibold text-white">HMAC Verification</h4>
            <p className="text-xs text-slate-400 mt-1">Signature validated using constant-time crypto comparison.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Step 3</div>
            <h4 className="text-sm font-semibold text-white">BullMQ Redis Queue</h4>
            <p className="text-xs text-slate-400 mt-1">Job buffered for async worker processing (&lt;50ms response).</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Step 4</div>
            <h4 className="text-sm font-semibold text-white">WhatsApp Delivery</h4>
            <p className="text-xs text-slate-400 mt-1">Template transmitted via Meta Graph API v17.0.</p>
          </div>
        </div>
      </div>

      {/* Connect Store Modal */}
      <ConnectStoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        onSuccess={() => fetchStats()}
      />
    </div>
  );
}

export default OverviewPage;
