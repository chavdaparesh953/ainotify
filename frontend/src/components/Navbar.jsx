import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Menu, LogOut, User, ShieldCheck } from 'lucide-react';

export function Navbar({ onToggleMobileMenu }) {
  const { user, logout } = useAuth();

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'M';
  const subscriptionStatus = user?.subscriptionStatus || 'TRIAL';

  return (
    <header className="h-16 glass-panel border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 bg-slate-950/80">
      {/* Left Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-slate-400">BullMQ & Meta Gateway Online</span>
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        {/* Subscription Plan Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{subscriptionStatus} PLAN</span>
        </div>

        {/* User Info Capsule */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            {userInitial}
          </div>

          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-slate-200 truncate max-w-[180px]">
              {user?.email || 'Merchant User'}
            </p>
            <p className="text-[10px] text-slate-400">Merchant Account</p>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
