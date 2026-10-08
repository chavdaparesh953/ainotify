import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient.js';
import ConnectStoreModal from '../components/ConnectStoreModal.jsx';
import {
  Store,
  Plus,
  Globe,
  ShieldCheck,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  Trash2,
  AlertTriangle,
  Copy,
  Check,
  Plug,
  X,
} from 'lucide-react';
import { BrandLoader } from '../components/BrandLoader.jsx';

export function StoresPage() {
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [pluginStoreModal, setPluginStoreModal] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/dashboard/stores');
      if (res.data?.stores) {
        setStores(res.data.stores);
      }
    } catch (err) {
      console.error('Failed to fetch merchant stores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleDeleteStore = async () => {
    if (!storeToDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await axiosClient.delete(`/stores/${storeToDelete.id}`);
      setStoreToDelete(null);
      await fetchStores();
    } catch (err) {
      console.error('Failed to disconnect store:', err);
      setDeleteError(err.response?.data?.message || 'Failed to disconnect store.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Connected Stores</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your Shopify and WooCommerce store connections, webhooks, and channel credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStores}
            disabled={isLoading}
            className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh stores"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Connect New Store</span>
          </button>
        </div>
      </div>

      {/* Stores List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-3xl glass-card animate-pulse" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        /* Empty State */
        <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto my-8 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No connected stores yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Connect your Shopify or WooCommerce store to start automating order confirmations and cart recoveries on WhatsApp.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Your First Store</span>
          </button>
        </div>
      ) : (
        /* Stores Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stores.map((store) => {
            const isShopify = store.platform === 'SHOPIFY';
            return (
              <div
                key={store.id}
                className="glass-card rounded-3xl p-6 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Platform Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isShopify
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{store.platform}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Active</span>
                      </span>

                      <button
                        onClick={() => setStoreToDelete(store)}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Disconnect Store"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Store Name & URL */}
                  <h3 className="text-lg font-bold text-white tracking-tight break-all flex items-center gap-1.5">
                    <span>{store.storeUrl}</span>
                    <a
                      href={`https://${store.storeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-emerald-400 transition-colors"
                      title="Open store in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </h3>

                  {/* Store ID with Copy */}
                  <div className="flex items-center justify-between mt-2 text-[11px] font-mono bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-400">
                    <span className="truncate mr-2" title={store.id}>ID: {store.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(store.id, `id-${store.id}`)}
                      className="text-slate-400 hover:text-white transition-colors shrink-0 flex items-center gap-1 font-sans text-[10px] font-medium"
                      title="Copy full Store ID"
                    >
                      {copiedKey === `id-${store.id}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* WooCommerce Plugin Quick Setup Button */}
                  {!isShopify && (
                    <button
                      type="button"
                      onClick={() => setPluginStoreModal(store)}
                      className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <Plug className="w-3.5 h-3.5 text-indigo-400" />
                      <span>WordPress Plugin Setup Keys</span>
                    </button>
                  )}

                  {/* Metrics & Features */}
                  <div className="mt-4 space-y-2.5 pt-3.5 border-t border-slate-800/80 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Messages Dispatched</span>
                      </span>
                      <span className="font-semibold text-white">{store.totalMessages ?? 0}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>HMAC Security</span>
                      </span>
                      <span className="text-emerald-400 font-medium">Configured</span>
                    </div>
                  </div>
                </div>

                {/* Footer Timestamp & Disconnect */}
                <div className="mt-6 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Connected {new Date(store.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => setStoreToDelete(store)}
                    className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connect Store Modal */}
      <ConnectStoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchStores()}
      />

      {/* Disconnect Store Confirmation Modal */}
      {storeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md glass-panel bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Disconnect Store</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Are you sure you want to disconnect <span className="font-semibold text-white font-mono break-all">{storeToDelete.storeUrl}</span>?
                This will safely remove webhook synchronizations, order logs, and automation rules for this store.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStoreToDelete(null);
                  setDeleteError('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteStore}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-600/20 disabled:opacity-60"
              >
                {isDeleting ? (
                  <BrandLoader variant="inline" message="Disconnecting..." />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Disconnect Store</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WordPress Plugin Connection Helper Modal */}
      {pluginStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg glass-panel bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              onClick={() => setPluginStoreModal(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shrink-0">
                <Plug className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">WordPress Plugin Setup Keys</h3>
                <p className="text-xs text-slate-400 font-mono truncate max-w-xs">{pluginStoreModal.storeUrl}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To connect your WooCommerce store using the official <strong>WaNotify WordPress Plugin</strong>, copy these credentials into your WordPress Admin under <strong>WooCommerce &rarr; WaNotify</strong>:
            </p>

            <div className="space-y-3">
              {/* WaNotify Platform URL */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">WaNotify Platform URL</span>
                  <button
                    onClick={() => handleCopy('https://ecommerce-saas-api.onrender.com', 'copy-platform-url')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    {copiedKey === 'copy-platform-url' ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>}
                  </button>
                </div>
                <code className="text-xs text-indigo-300 font-mono break-all select-all">https://ecommerce-saas-api.onrender.com</code>
              </div>

              {/* Store ID */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Store ID</span>
                  <button
                    onClick={() => handleCopy(pluginStoreModal.id, 'copy-store-id-modal')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    {copiedKey === 'copy-store-id-modal' ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>}
                  </button>
                </div>
                <code className="text-xs text-white font-mono break-all select-all">{pluginStoreModal.id}</code>
              </div>

              {/* Webhook Secret Note */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Webhook Secret</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter the same <strong>Webhook Secret</strong> you set when connecting this store (e.g. your HMAC key).
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
              💡 <strong>Next Step:</strong> In WordPress, click <strong>Save Changes</strong> &rarr; then click <strong>Test Live Connection</strong>. The badge will instantly change to green <strong>Connected</strong>!
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPluginStoreModal(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoresPage;
