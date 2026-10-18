import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone, CheckCircle, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AndroidInstallModal({ isOpen, onClose }: AndroidInstallModalProps) {
  const { isInstallable, install, isInstalled } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-sm bg-[#09152b] border border-[#1e3b6e] rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* App Header Emblem */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-orange-500 p-0.5 shadow-lg shadow-cyan-500/20 overflow-hidden shrink-0">
              <img src="/arena_khel_logo.png" alt="Arena Khel" className="w-full h-full object-cover rounded-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Official Android App
                </span>
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-tight mt-1 leading-tight">
                Arena Khel APK
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Free Fire Tournaments & Rewards</p>
            </div>
          </div>

          {/* Features bullet list */}
          <div className="space-y-2.5 mb-6 bg-[#060e1e] p-3.5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Zap size={14} className="text-amber-400 shrink-0" />
              <span className="text-[11px] font-bold">Zero Lag & Full Screen Mobile Experience</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Smartphone size={14} className="text-cyan-400 shrink-0" />
              <span className="text-[11px] font-bold">Instant Status Bar Room ID & Match Alerts</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold">Fast Auto-Login & Instant Deposits</span>
            </div>
          </div>

          {/* Direct Install button or Manual steps */}
          {isInstallable ? (
            <button
              onClick={handleInstallClick}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
            >
              <Download size={18} />
              Install Android App Now
            </button>
          ) : isInstalled ? (
            <div className="py-3 px-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
              <CheckCircle size={20} className="mx-auto mb-1 text-emerald-400" />
              <p className="text-xs font-black text-emerald-400 uppercase">App Already Installed</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Arena Khel is active on your device</p>
            </div>
          ) : (
            <div className="space-y-2 text-left">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-wider mb-2">
                Easy 2-Step Android Install:
              </p>
              <div className="p-3 bg-[#0c1833] rounded-xl border border-white/5 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-black text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                <p className="text-[11px] text-slate-300">
                  Tap your Chrome browser menu icon <strong className="text-white">⋮ (three dots)</strong> at top right.
                </p>
              </div>
              <div className="p-3 bg-[#0c1833] rounded-xl border border-white/5 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-black text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                <p className="text-[11px] text-slate-300">
                  Tap <strong className="text-cyan-400">"Install app"</strong> or <strong className="text-cyan-400">"Add to Home screen"</strong>.
                </p>
              </div>
            </div>
          )}

          <p className="text-center text-[9px] text-slate-500 mt-4 uppercase font-bold tracking-widest">
            Safe & Verified • v3.2.0 • 100% Android Compatible
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
