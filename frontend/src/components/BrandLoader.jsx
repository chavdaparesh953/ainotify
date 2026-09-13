import React from 'react';

/**
 * BrandLoader - Official WaNotify Brand Loader
 * Matches wa-logo.svg and emerald/teal SaaS brand aesthetics.
 * 
 * Variants:
 * - 'fullscreen': Full-page glassmorphism overlay (ideal for initial site load / auth transition)
 * - 'card': Centered card container (ideal for dashboard sections / tabs)
 * - 'inline': Compact lightweight spinner with logo icon (ideal for buttons / small cards)
 */
export function BrandLoader({
  variant = 'fullscreen',
  message = 'Loading WaNotify...',
  subtext = 'Connecting e-commerce & WhatsApp gateway',
  size = 'md',
  showBrandTitle = variant === 'fullscreen',
  showDots = true,
  showBar = variant === 'fullscreen',
  className = '',
}) {
  // Size dimensions
  const logoDimensions = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  }[size] || 'w-16 h-16';

  const ringDimensions = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-36 h-36',
  }[size] || 'w-28 h-28';

  // Compact inline variant
  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <div className="relative flex items-center justify-center">
          {/* Subtle spinning ring */}
          <div className="w-6 h-6 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
          {/* Center mini logo */}
          <img
            src="/wa-logo.svg"
            alt="Loading"
            className="w-3.5 h-3.5 absolute drop-shadow-sm"
          />
        </div>
        {message && (
          <span className="text-xs font-medium text-slate-300 animate-pulse">
            {message}
          </span>
        )}
      </div>
    );
  }

  // Main Loader Body (Used by 'fullscreen' and 'card')
  const content = (
    <div className="flex flex-col items-center justify-center text-center select-none">
      {/* Visual Logo Centerpiece with Orbit Ring and Ambient Glow */}
      <div className="relative flex items-center justify-center mb-6">
        {/* 1. Ambient Background Pulse Glow */}
        <div className="absolute w-36 h-36 bg-gradient-to-tr from-teal-500/25 to-emerald-500/25 rounded-full blur-2xl animate-pulse pointer-events-none" />

        {/* 2. Expanding Sonar Ping Wave */}
        <div className={`absolute ${ringDimensions} rounded-full border border-emerald-400/30 animate-ping opacity-40 pointer-events-none`} />

        {/* 3. Outer Spinning Gradient Orbit Ring */}
        <div className={`relative ${ringDimensions} rounded-full flex items-center justify-center p-[2px]`}>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-400 border-r-emerald-500 animate-spin" style={{ animationDuration: '1.4s' }} />
          <div className="absolute inset-1 rounded-full border border-slate-800/80" />

          {/* 4. Center Logo Container with Soft Levitation */}
          <div className="relative z-10 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md flex items-center justify-center">
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
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Wa<span className="text-teal-400">Notify</span>
          </span>
        </div>
      )}

      {/* Primary Message */}
      {message && (
        <p className="text-sm font-semibold text-slate-200 mt-1">
          {message}
        </p>
      )}

      {/* Animated 3-dot WhatsApp Message Rhythm */}
      {showDots && (
        <div className="flex items-center justify-center gap-1.5 my-2.5">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-teal-300 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}

      {/* Subtext info */}
      {subtext && (
        <p className="text-xs text-slate-400 font-mono tracking-wide max-w-xs">
          {subtext}
        </p>
      )}

      {/* Sleek Horizontal Indeterminate Progress Bar */}
      {showBar && (
        <div className="w-48 h-1 bg-slate-800/80 rounded-full mt-4 overflow-hidden relative">
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-200 w-24 rounded-full animate-shimmer"
            style={{
              animation: 'shimmerSweep 1.6s ease-in-out infinite',
              position: 'absolute',
            }}
          />
        </div>
      )}
    </div>
  );

  // Full-Screen Variant
  if (variant === 'fullscreen') {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl ${className}`}>
        {content}
      </div>
    );
  }

  // Card Variant
  return (
    <div className={`glass-panel p-10 rounded-3xl border border-slate-800 flex items-center justify-center shadow-2xl ${className}`}>
      {content}
    </div>
  );
}

export default BrandLoader;
