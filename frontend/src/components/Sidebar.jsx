import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  MessageSquareText,
  CreditCard,
  Settings,
  Sparkles,
  Sliders,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Stores', path: '/dashboard/stores', icon: Store },
  { name: 'Automations', path: '/dashboard/automations', icon: Sliders },
  { name: 'Message Logs', path: '/dashboard/logs', icon: MessageSquareText },
  { name: 'Billing & Plans', path: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings },
];

export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 glass-panel border-r border-slate-800/80 bg-slate-950/95 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/60">
          <img
            src="/wa-logo.svg"
            alt="WaNotify"
            className="w-8 h-8 drop-shadow-md shrink-0"
          />
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              WaNotify
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5">
                SaaS
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">WhatsApp & SMS Automation</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2">
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Main Menu
            </span>
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all outline-none focus:outline-none focus-visible:outline-none select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 font-semibold border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Integration Status Footer */}
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800/80">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">Active Channels</span>
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Directly syncing with Shopify, WooCommerce & Meta Cloud API.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Webhook Pipeline Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
