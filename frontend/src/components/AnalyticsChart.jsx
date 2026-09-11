import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, MessageSquare, ShoppingCart, Smartphone, Radio } from 'lucide-react';

/**
 * Custom glassmorphic tooltip for Recharts AreaChart
 */
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {};
    return (
      <div className="bg-slate-950/95 border border-slate-800/90 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs space-y-2.5 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="font-bold text-white text-sm tracking-tight">{label}</span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full">
            Total: {data.total ?? 0}
          </span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          {/* WhatsApp */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400/50" />
              <span>WhatsApp Messages</span>
            </div>
            <span className="font-bold text-teal-300 font-mono">{data.whatsapp ?? 0}</span>
          </div>

          {/* SMS Fallback */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              <span>SMS Fallbacks</span>
            </div>
            <span className="font-bold text-cyan-300 font-mono">{data.sms ?? 0}</span>
          </div>

          {/* Recovered Checkouts */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <span>Recovered Checkouts</span>
            </div>
            <span className="font-bold text-emerald-300 font-mono">{data.recovered ?? 0}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function AnalyticsChart({ chartData = [], isLoading = false }) {
  // Compute 7-day cumulative metrics
  const totalWhatsApp = chartData.reduce((acc, curr) => acc + (curr.whatsapp || 0), 0);
  const totalSms = chartData.reduce((acc, curr) => acc + (curr.sms || 0), 0);
  const totalRecovered = chartData.reduce((acc, curr) => acc + (curr.recovered || 0), 0);

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 space-y-6 relative overflow-hidden transition-all duration-300">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>7-Day Automation Trends</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  Live
                </span>
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Real-time breakdown of WhatsApp transmissions, multi-channel SMS fallbacks, and recovered abandoned carts.
          </p>
        </div>

        {/* Legend Summary Badges */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            <span className="text-slate-400">WhatsApp:</span>
            <span className="font-bold text-white font-mono">{totalWhatsApp.toLocaleString()}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-400">SMS Fallback:</span>
            <span className="font-bold text-white font-mono">{totalSms.toLocaleString()}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Recovered:</span>
            <span className="font-bold text-white font-mono">{totalRecovered.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[280px] sm:h-[320px] w-full pt-2">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
              <Radio className="w-5 h-5 animate-spin text-teal-400" />
              <span>Loading trend metrics...</span>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            No activity logged in the past 7 days.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {/* Gradient WhatsApp (#14b8a6) */}
                <linearGradient id="waGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                </linearGradient>

                {/* Gradient SMS Fallback (#06b6d4) */}
                <linearGradient id="smsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>

                {/* Gradient Recovered Checkouts (#10b981) */}
                <linearGradient id="recoveredGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={10}
              />

              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Area for WhatsApp */}
              <Area
                type="monotone"
                dataKey="whatsapp"
                name="WhatsApp"
                stroke="#14b8a6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#waGradient)"
              />

              {/* Area for SMS Fallback */}
              <Area
                type="monotone"
                dataKey="sms"
                name="SMS Fallback"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#smsGradient)"
              />

              {/* Area for Recovered Checkouts */}
              <Area
                type="monotone"
                dataKey="recovered"
                name="Recovered"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#recoveredGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default AnalyticsChart;
