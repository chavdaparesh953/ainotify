import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLoader } from '../components/BrandLoader.jsx';
import { Play, RotateCcw, Check, Sparkles, ArrowLeft, Layers } from 'lucide-react';

export function LoaderPreviewPage() {
  const [activeTab, setActiveTab] = useState('card'); // 'fullscreen' | 'card' | 'inline'
  const [isFullscreenSimulating, setIsFullscreenSimulating] = useState(false);
  const [customMessage, setCustomMessage] = useState('Loading WaNotify...');
  const [customSubtext, setCustomSubtext] = useState('Connecting e-commerce & WhatsApp gateway');
  const [loaderSize, setLoaderSize] = useState('md'); // 'sm' | 'md' | 'lg'

  const startFullscreenSimulation = () => {
    setIsFullscreenSimulating(true);
    setTimeout(() => {
      setIsFullscreenSimulating(false);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 relative selection:bg-teal-500 selection:text-slate-950">
      {/* Background ambient glow */}
      <div className="absolute top-10 left-1/3 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 relative z-10">
        <div className="flex items-center justify-between gap-4 mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Brand Loader Design Studio
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          WaNotify Custom Brand Loader Preview
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Designed specifically for our official <span className="text-teal-400 font-mono font-bold">wa-logo.svg</span> with emerald/teal theme colors, spinning orbit rings, and WhatsApp message pulse.
        </p>
      </div>

      {/* Main Preview Playground Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-start">
        {/* Left: Interactive Preview Display */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tabs for variant */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <button
              onClick={() => setActiveTab('card')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'card'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Card View (Default)
            </button>
            <button
              onClick={() => setActiveTab('inline')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'inline'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inline Spinner
            </button>
            <button
              onClick={startFullscreenSimulation}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Full Screen Demo (3s)</span>
            </button>
          </div>

          {/* Loader Canvas */}
          <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-12 min-h-[380px] flex items-center justify-center relative overflow-hidden shadow-2xl">
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-radial from-teal-500/5 to-transparent pointer-events-none" />

            {activeTab === 'card' && (
              <BrandLoader
                variant="card"
                message={customMessage}
                subtext={customSubtext}
                size={loaderSize}
                className="w-full max-w-sm"
              />
            )}

            {activeTab === 'inline' && (
              <div className="space-y-6 w-full max-w-sm text-left">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-2">Inside Button Example:</p>
                  <button className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-teal-500/10 border border-teal-500/30 text-teal-300 flex items-center justify-center gap-2">
                    <BrandLoader variant="inline" message="Saving automations..." />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-2">Inside Table / Section Example:</p>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <BrandLoader variant="inline" message="Syncing orders with Shopify REST API..." />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Design Elements Breakdown & Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Controls Box */}
          <div className="glass-panel bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              Customize Loader Properties
            </h2>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Primary Message</label>
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Subtext / Technical Note</label>
              <input
                type="text"
                value={customSubtext}
                onChange={(e) => setCustomSubtext(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Logo & Ring Size</label>
              <div className="grid grid-cols-3 gap-2">
                {['sm', 'md', 'lg'].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setLoaderSize(sz)}
                    className={`py-1.5 text-xs font-bold rounded-lg uppercase transition-all ${
                      loaderSize === sz
                        ? 'bg-teal-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startFullscreenSimulation}
              className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Test Live Fullscreen Overlay (3.5s)</span>
            </button>
          </div>

          {/* Design Architecture Breakdown Card */}
          <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-xs text-slate-300 space-y-3">
            <h3 className="font-bold text-white text-sm">🎨 Brand Design Elements Included:</h3>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                <span><strong>Official wa-logo.svg:</strong> Center vector chat bubble with green-teal gradient (#14b8a6 to #059669).</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                <span><strong>Spinning Dual Orbit Ring:</strong> Emerald/teal gradient arc rotating smoothly around the logo.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                <span><strong>Expanding Sonar Ping Wave:</strong> Radar-like wave signaling active automated WhatsApp dispatch.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                <span><strong>WhatsApp Typing Rhythm:</strong> 3 green dots bouncing sequentially like a WhatsApp message waiting state.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                <span><strong>Zero External JS Dependencies:</strong> Built 100% with pure CSS/Tailwind GPU acceleration.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay Demo (when triggered) */}
      {isFullscreenSimulating && (
        <BrandLoader
          variant="fullscreen"
          message={customMessage}
          subtext={customSubtext}
          size={loaderSize}
        />
      )}
    </div>
  );
}

export default LoaderPreviewPage;
