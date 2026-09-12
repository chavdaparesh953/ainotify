import React from 'react';

const COLOR_MAP = {
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    accent: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    glow: 'group-hover:border-emerald-500/40',
  },
  indigo: {
    iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    accent: 'from-indigo-500/20 via-indigo-500/5 to-transparent',
    glow: 'group-hover:border-indigo-500/40',
  },
  rose: {
    iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    accent: 'from-rose-500/20 via-rose-500/5 to-transparent',
    glow: 'group-hover:border-rose-500/40',
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    accent: 'from-amber-500/20 via-amber-500/5 to-transparent',
    glow: 'group-hover:border-amber-500/40',
  },
  cyan: {
    iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    accent: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    glow: 'group-hover:border-cyan-500/40',
  },
  teal: {
    iconBg: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
    accent: 'from-teal-500/20 via-teal-500/5 to-transparent',
    glow: 'group-hover:border-teal-500/40',
  },
  purple: {
    iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    accent: 'from-purple-500/20 via-purple-500/5 to-transparent',
    glow: 'group-hover:border-purple-500/40',
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald', badge }) {
  const theme = COLOR_MAP[color] || COLOR_MAP.emerald;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl glass-card p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between ${theme.glow}`}
    >
      {/* Subtle Background Gradient Accents */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${theme.accent} blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 truncate">
            {title}
          </p>
          <div className="mt-2.5 flex items-baseline gap-2.5 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {value}
            </span>
            {badge && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/80 whitespace-nowrap shrink-0">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1.5 text-xs text-slate-400 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${theme.iconBg}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
