import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient.js';
import {
  Sliders,
  CheckCircle2,
  ShoppingBag,
  Truck,
  MessageSquareDot,
  Save,
  Plus,
  Trash2,
  Store,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Info,
} from 'lucide-react';

const EVENT_CONFIG = {
  ORDER_CREATED: {
    title: 'Order Confirmation',
    subtitle: 'Standard & Prepaid Orders',
    icon: CheckCircle2,
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    description:
      'Dispatches an automated WhatsApp message immediately after an order is placed to confirm items and total amount.',
    defaultTemplate: 'order_confirmation',
    defaultBody: 'Hi {{1}}, thank you for your order {{2}} for {{3}}!',
  },
  COD_VERIFICATION: {
    title: 'COD Order Verification',
    subtitle: 'Cash on Delivery Orders',
    icon: MessageSquareDot,
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    description:
      'Sends an interactive message with Quick Reply buttons (Confirm / Cancel) to verify Cash on Delivery orders before dispatch.',
    defaultTemplate: 'cod_interactive_verification',
    defaultBody: 'Hi {{1}}, please verify your Cash on Delivery order {{2}} for {{3}}.',
  },
  ABANDONED_CHECKOUT: {
    title: 'Abandoned Cart Recovery',
    subtitle: 'Cart & Checkout Drop-offs',
    icon: ShoppingBag,
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    description:
      'Re-engages shoppers who left items in their checkout with a personalized reminder to boost completed purchases.',
    defaultTemplate: 'abandoned_cart_recovery',
    defaultBody: 'Hi {{1}}, you left items in your cart totaling {{2}}! Complete your purchase now for 10% off.',
  },
  ORDER_FULFILLED: {
    title: 'Order Shipped / Tracking',
    subtitle: 'Fulfillment & Dispatch',
    icon: Truck,
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    description:
      'Notifies customers the moment their shipment is packed and dispatched with tracking details.',
    defaultTemplate: 'order_shipped',
    defaultBody: 'Good news {{1}}! Your order {{2}} has been shipped and is on its way.',
  },
};

const SUGGESTED_VARIABLES = [
  { label: 'Customer Full Name', value: 'customer.name' },
  { label: 'Customer First Name', value: 'customer.first_name' },
  { label: 'Order Number', value: 'order.number' },
  { label: 'Total Price', value: 'order.total' },
  { label: 'Currency', value: 'order.currency' },
  { label: 'Store Name', value: 'store.name' },
  { label: 'Customer Phone', value: 'customer.phone' },
  { label: 'Customer Email', value: 'customer.email' },
  { label: 'Checkout Recovery Link', value: 'checkout.abandoned_checkout_url' },
];

export function AutomationsPage() {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // 1. Fetch Merchant Stores
  useEffect(() => {
    async function loadStores() {
      try {
        const res = await axiosClient.get('/dashboard/stores');
        if (res.data?.success && res.data.stores?.length > 0) {
          setStores(res.data.stores);
          setSelectedStoreId(res.data.stores[0].id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load merchant stores:', err);
        setIsLoading(false);
      }
    }
    loadStores();
  }, []);

  // 2. Fetch Rules whenever selectedStoreId changes
  useEffect(() => {
    if (!selectedStoreId) return;

    async function loadRules() {
      setIsLoading(true);
      try {
        const res = await axiosClient.get(`/automations/${selectedStoreId}`);
        if (res.data?.success) {
          setRules(res.data.rules || []);
        }
      } catch (err) {
        console.error('Failed to load store automation rules:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRules();
  }, [selectedStoreId]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Update a field in local state
  const handleRuleChange = (triggerEvent, field, value) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.triggerEvent === triggerEvent) {
          return { ...r, [field]: value };
        }
        return r;
      })
    );
  };

  // Variable Mapping helpers
  const handleVariableMapChange = (triggerEvent, paramKey, sourceField) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.triggerEvent === triggerEvent) {
          const currentMap = { ...(r.variableMap || {}) };
          currentMap[paramKey] = sourceField;
          return { ...r, variableMap: currentMap };
        }
        return r;
      })
    );
  };

  const handleAddParameter = (triggerEvent) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.triggerEvent === triggerEvent) {
          const currentMap = { ...(r.variableMap || {}) };
          const keys = Object.keys(currentMap).map((k) => parseInt(k, 10)).filter((n) => !isNaN(n));
          const nextIndex = keys.length > 0 ? Math.max(...keys) + 1 : 1;
          currentMap[String(nextIndex)] = 'customer.name';
          return { ...r, variableMap: currentMap };
        }
        return r;
      })
    );
  };

  const handleRemoveParameter = (triggerEvent, paramKey) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.triggerEvent === triggerEvent) {
          const currentMap = { ...(r.variableMap || {}) };
          delete currentMap[paramKey];
          return { ...r, variableMap: currentMap };
        }
        return r;
      })
    );
  };

  // Save single rule
  const handleSaveRule = async (rule) => {
    setIsSaving((prev) => ({ ...prev, [rule.triggerEvent]: true }));
    try {
      const res = await axiosClient.put(`/automations/${selectedStoreId}/rule`, rule);
      if (res.data?.success) {
        showToast(`${EVENT_CONFIG[rule.triggerEvent]?.title || rule.triggerEvent} saved successfully!`);
      }
    } catch (err) {
      console.error('Failed to save rule:', err);
      showToast(err.response?.data?.message || 'Failed to save automation rule', 'error');
    } finally {
      setIsSaving((prev) => ({ ...prev, [rule.triggerEvent]: false }));
    }
  };

  // Save all rules in batch
  const handleSaveAll = async () => {
    setIsSaving((prev) => ({ ...prev, all: true }));
    try {
      const res = await axiosClient.put(`/automations/${selectedStoreId}/batch`, { rules });
      if (res.data?.success) {
        showToast('All automation rules saved successfully!');
      }
    } catch (err) {
      console.error('Failed to batch save rules:', err);
      showToast(err.response?.data?.message || 'Failed to save automations', 'error');
    } finally {
      setIsSaving((prev) => ({ ...prev, all: false }));
    }
  };

  if (stores.length === 0 && !isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Store Connected</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Please connect your Shopify or WooCommerce store first to configure custom notification templates and automation rules.
          </p>
          <a
            href="/dashboard/stores"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600 transition-all"
          >
            Connect Store Now
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-700/60 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-700/60 text-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-emerald-400" />
            Notification Automations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Customize WhatsApp templates, language codes, and dynamic variable mappings for each e-commerce event.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Store Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 pr-10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.storeUrl} ({s.platform})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Save All Button */}
          <button
            onClick={handleSaveAll}
            disabled={isSaving.all || isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50"
          >
            {isSaving.all ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save All Rules</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-96 rounded-3xl glass-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map((rule) => {
            const config = EVENT_CONFIG[rule.triggerEvent] || {
              title: rule.triggerEvent,
              subtitle: 'Trigger Event',
              icon: Sparkles,
              badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
              description: 'Custom trigger event',
              defaultTemplate: rule.templateName,
            };

            const Icon = config.icon;
            const isEnabled = rule.isEnabled;
            const variableMap = rule.variableMap || {};
            const paramKeys = Object.keys(variableMap).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

            return (
              <div
                key={rule.triggerEvent}
                className={`glass-panel rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                  isEnabled
                    ? 'border-slate-800 hover:border-emerald-500/40 bg-slate-900/90'
                    : 'border-slate-800/50 bg-slate-950/40 opacity-70'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                          isEnabled
                            ? 'bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-white tracking-tight">{config.title}</h3>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.badgeColor}`}
                          >
                            {config.subtitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{config.description}</p>
                      </div>
                    </div>

                    {/* Enable / Disable Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleRuleChange(rule.triggerEvent, 'isEnabled', !isEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                      role="switch"
                      aria-checked={isEnabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Form Settings */}
                  <div className="py-4 space-y-4 text-xs">
                    {/* Template Name & Language Code */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-slate-400 font-medium mb-1">
                          Meta Template Name
                        </label>
                        <input
                          type="text"
                          value={rule.templateName || ''}
                          onChange={(e) => handleRuleChange(rule.triggerEvent, 'templateName', e.target.value)}
                          placeholder={config.defaultTemplate}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-medium mb-1">
                          Language
                        </label>
                        <input
                          type="text"
                          value={rule.languageCode || 'en'}
                          onChange={(e) => handleRuleChange(rule.triggerEvent, 'languageCode', e.target.value)}
                          placeholder="en"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 uppercase"
                        />
                      </div>
                    </div>

                    {/* Dynamic Variables Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                          Template Variables Mapping
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddParameter(rule.triggerEvent)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Parameter</span>
                        </button>
                      </div>

                      {/* Quick Variable Suggestions */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[10px] text-slate-400 mr-1 self-center">Quick tags:</span>
                        {SUGGESTED_VARIABLES.map((v) => (
                          <button
                            key={v.value}
                            type="button"
                            onClick={() => {
                              // Auto-fill into the last parameter or add a new one
                              const keys = Object.keys(variableMap);
                              const targetKey = keys.length > 0 ? keys[keys.length - 1] : '1';
                              handleVariableMapChange(rule.triggerEvent, targetKey, v.value);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-mono border border-slate-700 transition-colors"
                            title={`Insert ${v.value}`}
                          >
                            +{v.value}
                          </button>
                        ))}
                      </div>

                      {/* Parameter Rows */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {paramKeys.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic py-2">
                            No variables configured. Click "+ Add Parameter" to bind placeholders.
                          </p>
                        ) : (
                          paramKeys.map((key) => (
                            <div
                              key={key}
                              className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80"
                            >
                              <span className="w-10 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold text-center">
                                {'{{' + key + '}}'}
                              </span>
                              <span className="text-slate-400 text-xs">➔</span>
                              <input
                                type="text"
                                value={variableMap[key] || ''}
                                onChange={(e) => handleVariableMapChange(rule.triggerEvent, key, e.target.value)}
                                placeholder="customer.name, order.number..."
                                className="flex-1 bg-transparent border-0 text-xs font-mono text-slate-200 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveParameter(rule.triggerEvent, key)}
                                className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                                title="Remove parameter"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Save Button */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                    <span>{isEnabled ? 'Active Automation' : 'Disabled'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveRule(rule)}
                    disabled={isSaving[rule.triggerEvent]}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving[rule.triggerEvent] ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    ) : (
                      <Save className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AutomationsPage;
