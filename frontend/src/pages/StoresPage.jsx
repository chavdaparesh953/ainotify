import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient.js';
import ConnectStoreModal from '../components/ConnectStoreModal.jsx';
import { Store, Plus, Globe, ShieldCheck, MessageSquare, ExternalLink, RefreshCw, ShoppingBag } from 'lucide-react';

export function StoresPage() {
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Active</span>
                    </span>
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

                  <p className="text-[11px] text-slate-500 mt-1 font-mono">ID: {store.id.slice(0, 16)}...</p>

                  {/* Metrics & Features */}
                  <div className="mt-6 space-y-2.5 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
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

                {/* Footer Timestamp */}
                <div className="mt-6 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Connected</span>
                  <span>{new Date(store.createdAt).toLocaleDateString()}</span>
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
    </div>
  );
}

export default StoresPage;
