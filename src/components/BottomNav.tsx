import React from 'react';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { Gift, Trophy, Home as HomeIcon, MoreHorizontal } from 'lucide-react';
import { Page, User } from '../types';

interface BottomNavProps {
  currentPage?: Page;
  onPageChange: (page: Page, param?: string) => void;
  user?: User | null;
  onOpenRules?: () => void;
  onOpenSupport?: () => void;
  onOpenMenu?: () => void;
}

export default function BottomNav({
  onPageChange,
  onOpenMenu,
}: BottomNavProps) {
  const location = useLocation();

  const tabs = [
    {
      id: 'earn',
      label: 'Earn',
      icon: Gift,
      path: '/referral',
      page: Page.REFERRAL,
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: Trophy,
      path: '/leaderboard',
      page: Page.LEADERBOARD,
    },
    {
      id: 'home',
      label: 'Home',
      icon: HomeIcon,
      path: '/home',
      page: Page.HOME,
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: MoreHorizontal,
      path: '/profile',
      page: Page.PROFILE,
      action: onOpenMenu
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#071328]/95 backdrop-blur-xl border-t border-[#122347] pb-safe z-40 shadow-2xl">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isHome = tab.id === 'home';
          const isActive = isHome
            ? location.pathname === '/' ||
              location.pathname.startsWith('/home') ||
              location.pathname.startsWith('/game-modes') ||
              location.pathname.startsWith('/tournaments')
            : location.pathname.startsWith(tab.path);

          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.action) {
                  tab.action();
                } else {
                  onPageChange(tab.page);
                }
              }}
              className={`relative flex flex-col items-center justify-center w-full h-full transition-all group select-none ${
                isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex flex-col items-center justify-center py-1">
                <div className="mb-1 transition-transform group-active:scale-90">
                  {tab.id === 'menu' ? (
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                      isActive ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400' : 'border-slate-500 text-slate-400'
                    }`}>
                      <MoreHorizontal size={16} />
                    </div>
                  ) : (
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.6 : 2}
                      className={isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-slate-300'}
                    />
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold tracking-tight transition-colors ${
                    isActive ? 'text-cyan-400 font-black' : 'text-slate-300'
                  }`}
                >
                  {tab.label}
                </span>

                {/* Active Indicator Bar as shown in reference */}
                {isActive && (
                  <motion.div
                    layoutId="activeBottomTab"
                    className="absolute bottom-0 w-8 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
