import React from 'react';

/**
 * BrandLoader - Official WaNotify Brand Loader
 * Clean, lightweight, high-contrast, matching wa-logo.svg and emerald/teal SaaS brand aesthetics.
 * 
 * Variants:
 * - 'fullscreen': Ultra-clean full-page glassmorphism overlay
 * - 'card': Centered card container for dashboard sections / tables
 * - 'inline': High-contrast button spinner (inherits button text & background color)
 */
export function BrandLoader({
  variant = 'fullscreen',
  message = '',
  subtext = '',
  size = 'md',
  showBrandTitle = true,
  showDots = false,
  showBar = true,
  className = '',
}) {
  // Size dimensions
  const logoDimensions = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  }[size] || 'w-14 h-14';

  const ringDimensions = {
    sm: 'w-14 h-14',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }[size] || 'w-24 h-24';

  // =========================================================================
  // 1. INLINE VARIANT (Buttons & Compact Actions)
  // Perfectly inherits button text & spinner color for 100% contrast!
  // =========================================================================
  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center justify-center gap-2 text-inherit ${className}`}>
        <div className="relative flex items-center justify-center shrink-0">
          <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin opacity-90" />
        </div>
        {message && (
          <span className="text-inherit font-bold text-xs tracking-tight whitespace-nowrap">
            {message}
          </span>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. MAIN BODY (Fullscreen & Card) - Sleek, Clean, Minimalist
  // =========================================================================
  const content = (
    <div className="flex flex-col items-center justify-center text-center select-none">
      {/* Visual Logo Centerpiece with Dual Orbit Ring & Ambient Glow */}
      <div className="relative flex items-center justify-center mb-5">
        {/* Ambient Background Soft Pulse */}
        <div className="absolute w-32 h-32 bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 rounded-full blur-2xl animate-pulse pointer-events-none" />

        {/* Outer Spinning Dual Gradient Orbit Ring */}
        <div className={`relative ${ringDimensions} rounded-full flex items-center justify-center p-[2px]`}>
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-400 border-r-emerald-500 animate-spin"
            style={{ animationDuration: '1.2s' }}
          />
          <div className="absolute inset-1 rounded-full border border-slate-800/80" />

          {/* Center Logo Container */}
          <div className="relative z-10 p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-2xl backdrop-blur-md flex items-center justify-center">
            <img
              src="/wa-logo.svg"
              alt="WaNotify"
              className={`${logoDimensions} drop-shadow-xl animate-pulse`}
              style={{ animationDuration: '2s' }}
            />
          </div>
        </div>
      </div>

      {/* Brand Title with Gradient Accent */}
      {showBrandTitle && (
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-2xl font-black tracking-tight text-white">
            Wa<span className="text-teal-400">Notify</span>
          </span>
        </div>
      )}

      {/* Primary Message (Clean single line, if provided) */}
      {message && (
        <p className="text-xs sm:text-sm font-semibold text-slate-200 mt-1">
          {message}
        </p>
      )}

      {/* Optional WhatsApp 3-dots Rhythm */}
      {showDots && (
        <div className="flex items-center justify-center gap-1.5 my-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}

      {/* Optional Subtext info */}
      {subtext && (
        <p className="text-[11px] text-slate-400 font-mono tracking-wide max-w-xs mt-1">
          {subtext}
        </p>
      )}

      {/* Minimalist Horizontal Progress Line */}
      {showBar && (
        <div className="w-36 sm:w-44 h-0.5 bg-slate-800/80 rounded-full mt-4 overflow-hidden relative">
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-200 w-20 rounded-full"
            style={{
              animation: 'shimmerSweep 1.5s ease-in-out infinite',
            }}
          />
        </div>
      )}
    </div>
  );

  // Full-Screen Variant
  if (variant === 'fullscreen') {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl ${className}`}>
        {content}
      </div>
    );
  }

  // Card Variant
  return (
    <div className={`glass-panel p-8 rounded-3xl border border-slate-800 flex items-center justify-center shadow-2xl ${className}`}>
      {content}
    </div>
  );
}

export default BrandLoader;
