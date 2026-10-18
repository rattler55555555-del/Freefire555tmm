import React, { useState } from 'react';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import AndroidInstallModal from './AndroidInstallModal';

export default function AndroidInstallBanner() {
  const { isInstallable, install, isInstalled } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('kg_android_banner_dismissed') === 'true';
  });

  if (isInstalled || dismissed) return null;

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowModal(true);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem('kg_android_banner_dismissed', 'true');
  };

  return (
    <>
      <section className="px-4 sm:px-5 mt-2 mb-2">
        <div
          onClick={handleAction}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d224a] via-[#103063] to-[#0a1b3b] border border-cyan-500/40 p-3 shadow-lg shadow-cyan-950/40 flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99] transition-all select-none"
        >
          {/* Subtle glow background */}
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-md shadow-cyan-500/30 flex items-center justify-center shrink-0">
              <img src="/arena_khel_logo.png" alt="Arena Khel" className="w-full h-full object-cover rounded-[10px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-black tracking-tight text-white uppercase truncate">
                  Download Android App
                </span>
                <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  APK
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-cyan-200/80 font-medium truncate">
                Faster match load, Room ID alerts & zero lag
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleAction}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 transition-all"
            >
              <Download size={13} />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </section>

      <AndroidInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
