import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await axiosClient.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
      if (res.data?.resetUrl) {
        setDevResetUrl(res.data.resetUrl);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to send reset instructions.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center justify-center mb-4 group">
          <img
            src="/wa-logo.svg"
            alt="WaNotify"
            className="w-14 h-14 drop-shadow-xl group-hover:scale-105 transition-transform"
          />
        </Link>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Reset password</h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your email to receive password reset instructions.
        </p>
      </div>

      {/* Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="glass-panel bg-slate-900/90 py-8 px-6 sm:px-10 rounded-3xl border border-slate-800 shadow-2xl">
          {isSubmitted ? (
            /* Success State */
            <div className="text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Instructions Sent</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  If an account exists for <span className="text-emerald-400 font-semibold">{email}</span>, you will receive an email with a secure link to reset your password.
                </p>
              </div>

              {/* Development Quick-Test Banner */}
              {devResetUrl && (
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-left space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400">
                    <span>⚡ Development Quick Link</span>
                    <span className="text-[10px] text-slate-400 font-mono">1h expiry</span>
                  </div>
                  <a
                    href={devResetUrl}
                    className="inline-flex items-center gap-1.5 text-xs text-white font-medium hover:text-emerald-400 underline break-all"
                  >
                    <span>Proceed to Reset Password Page</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@brand.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Instructions...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
