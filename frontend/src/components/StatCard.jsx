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
      className={`group relative overflow-hidden rounded-2xl glass-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${theme.glow}`}
    >
      {/* Subtle Background Gradient Accents */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${theme.accent} blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide uppercase text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">{value}</span>
            {badge && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-400 font-medium">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-xl shrink-0 ${theme.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
