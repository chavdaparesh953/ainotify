import React, { useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { X, ShoppingBag, Globe, Key, Shield, AlertCircle } from 'lucide-react';
import { BrandLoader } from './BrandLoader.jsx';

export function ConnectStoreModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();

  const [platform, setPlatform] = useState('SHOPIFY');
  const [storeUrl, setStoreUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const payload = {
        userId: user.id,
        storeUrl,
        platform,
        accessToken,
        webhookSecret,
      };

      const res = await axiosClient.post('/stores/connect', payload);

      if (res.data?.success) {
        onSuccess(res.data.store);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to connect store.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-panel bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Connect E-Commerce Store</h2>
          <p className="text-xs text-slate-400 mt-1">
            Authorize your Shopify or WooCommerce store to enable automated WhatsApp notifications.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Platform Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
              Select Platform
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlatform('SHOPIFY')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  platform === 'SHOPIFY'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>Shopify</span>
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

          {/* Store URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Store Domain / URL</span>
            </label>
            <input
              type="text"
              required
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder={platform === 'SHOPIFY' ? 'e.g. awesome-brand.myshopify.com' : 'e.g. https://my-store.com'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Access Token */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span>API Access Token</span>
            </label>
            <input
              type="password"
              required
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={platform === 'SHOPIFY' ? 'shpat_xxxxxxxxxxxxxxxx' : 'ck_xxxxxxxxxxxxxxxx'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Webhook Signing Secret (HMAC)</span>
            </label>
            <input
              type="password"
              required
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="shpss_xxxxxxxx or WooCommerce Secret"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <BrandLoader variant="inline" message="Connecting..." />
              ) : (
                <span>Connect Store</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ConnectStoreModal;
