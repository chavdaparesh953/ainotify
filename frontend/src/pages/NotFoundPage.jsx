import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, LayoutDashboard, HelpCircle } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950 flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/wa-logo.svg" alt="WaNotify" className="w-8 h-8 drop-shadow-md" />
          <span className="text-xl font-black text-white">
            Wa<span className="text-teal-400">Notify</span>
          </span>
        </Link>
      </header>

      {/* Hero 404 Content */}
      <main className="max-w-md mx-auto px-4 text-center my-auto py-12 relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 text-teal-400 shadow-2xl mb-6">
          <span className="text-3xl font-black font-mono tracking-tighter">404</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Page Not Found
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed mb-8">
          The link you followed may be broken, or the page may have been removed. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60 text-xs text-slate-500">
          Looking for help? <Link to="/contact" className="text-teal-400 hover:underline">Contact Merchant Support</Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} WaNotify SaaS Inc. All rights reserved.
      </footer>
    </div>
  );
}
export default NotFoundPage;
