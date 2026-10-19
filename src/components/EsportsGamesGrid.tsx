import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Page, Tournament } from '../types';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import SafeImage from './SafeImage';

export interface GameMode {
  id: string;
  gameId?: string;
  title: string;
  subtitle?: string;
  bannerText?: string;
  image?: string;
  category?: string;
  order?: number;
  count?: number;
  accent?: string;
}

interface EsportsGamesGridProps {
  matches: Tournament[];
  onPageChange: (page: Page, param?: string) => void;
}

// 10 Curated Esports Tournament Game Modes exactly matching user reference screenshot
const DEFAULT_ESPORTS_GAMES: GameMode[] = [
  {
    id: 'br_full_map',
    gameId: 'freefire',
    title: 'BR FULL MAP',
    bannerText: 'BR FULL MAP TOURNAMENT',
    subtitle: 'Battle Royale',
    category: 'Battle Royale',
    count: 25,
    accent: 'from-amber-500 to-orange-600',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'cs_1v1_2v2',
    gameId: 'freefire',
    title: 'CS 1V1 / 2V2',
    bannerText: 'CLASH SQUAD 1V1 TOURNAMENT',
    subtitle: 'Clash Squad',
    category: 'Clash Squad',
    count: 59,
    accent: 'from-cyan-500 to-blue-600',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'br_survival',
    gameId: 'freefire',
    title: 'BR SURVIVAL',
    bannerText: 'SOLO SURVIVAL TOURNAMENT',
    subtitle: 'Solo Survival',
    category: 'Battle Royale',
    count: 24,
    accent: 'from-orange-500 to-red-600',
    image: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'lw_1v1_2v2',
    gameId: 'freefire',
    title: 'LW 1V1 / 2V2',
    bannerText: 'LONE WOLF 1V1 TOURNAMENT',
    subtitle: 'Lone Wolf',
    category: 'Lone Wolf',
    count: 57,
    accent: 'from-purple-500 to-indigo-600',
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'br_survival_2',
    gameId: 'freefire',
    title: 'BR SURVIVAL 2',
    bannerText: 'SOLO SURVIVAL 2 TOURNAMENT',
    subtitle: 'Survival 2',
    category: 'Battle Royale',
    count: 3,
    accent: 'from-sky-500 to-blue-600',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'cs_onetap',
    gameId: 'freefire',
    title: 'CS ONETAP',
    bannerText: 'CS ONETAP TOURNAMENT',
    subtitle: 'Clash Squad Headshot',
    category: 'Clash Squad',
    count: 47,
    accent: 'from-red-500 to-rose-700',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'lw_lose',
    gameId: 'freefire',
    title: 'LW LOSE',
    bannerText: 'LOSE TO WIN',
    subtitle: 'Special Match',
    category: 'Lone Wolf',
    count: 25,
    accent: 'from-yellow-500 to-amber-600',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'br_rush',
    gameId: 'freefire',
    title: 'BR RUSH FULL MAP',
    bannerText: 'BR RUSH FULL MATCH',
    subtitle: 'Fast Zone Rush',
    category: 'Battle Royale',
    count: 12,
    accent: 'from-rose-600 to-red-700',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'only_ump',
    gameId: 'freefire',
    title: 'ONLY UMP',
    bannerText: 'ONLY UMP CHALLENGE MODE',
    subtitle: 'UMP Weapon Arena',
    category: 'Clash Squad',
    count: 23,
    accent: 'from-amber-400 to-yellow-600',
    image: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'free_match',
    gameId: 'freefire',
    title: 'FREE MATCH',
    bannerText: 'FREE GIVEAWAY',
    subtitle: 'Zero Entry Fee',
    category: 'Giveaway',
    count: 8,
    accent: 'from-emerald-400 to-teal-600',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop'
  }
];

export default function EsportsGamesGrid({ matches, onPageChange }: EsportsGamesGridProps) {
  const [dbModes, setDbModes] = useState<GameMode[]>([]);

  // Fetch dynamic game modes configured in Admin
  useEffect(() => {
    const q = query(collection(db, 'gameModes'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const fetchedModes = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as GameMode));
          setDbModes(fetchedModes);
        }
      },
      (error) => {
        console.warn('Game modes listener notice:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Use database modes if available, otherwise use reference preset list
  const displayModes = dbModes.length > 0 ? dbModes : DEFAULT_ESPORTS_GAMES;

  return (
    <section className="px-4 sm:px-5 mt-6 mb-6 select-none">
      {/* Exact Header matching Reference: "Esports Games" */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
          Esports Games
        </h2>
        <button
          onClick={() => onPageChange(Page.TOURNAMENTS, 'freefire')}
          className="text-[10px] font-black uppercase text-cyan-400 hover:text-cyan-300 tracking-wider transition-colors"
        >
          View All
        </button>
      </div>

      {/* 2-Column Horizontal Rectangular Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
        {displayModes.map((mode, idx) => {
          // Exactly count real matches created for this mode
          const modeId = (mode.id || '').toLowerCase();
          const modeTitle = (mode.title || '').toLowerCase();
          const modeCategory = (mode.category || '').toLowerCase();

          const liveCount = matches.filter((m) => {
            const mStatus = (m.status as string) || 'upcoming';
            const isActive = mStatus !== 'completed' && mStatus !== 'cancelled';
            if (!isActive) return false;

            const mModeId = (m.modeId || '').toLowerCase();
            const mMode = (m.mode || '').toLowerCase();
            const mSection = (m.section || '').toLowerCase();
            const mTitle = (m.title || '').toLowerCase();

            return (
              (mModeId && mModeId === modeId) ||
              (mMode && (mMode === modeTitle || modeTitle.includes(mMode) || mMode.includes(modeTitle))) ||
              (mSection && (mSection === modeCategory || mSection === modeTitle || modeTitle.includes(mSection))) ||
              (mTitle && (mTitle.includes(modeTitle) || modeTitle.includes(mTitle)))
            );
          }).length;

          // Strictly real count: if 1 match created, show 1. If 0 matches, show 0.
          const displayCount = liveCount;
          const bannerHeadline = mode.bannerText || (mode.subtitle && mode.subtitle.includes('TOURNAMENT') ? mode.subtitle : `${mode.title} TOURNAMENT`);

          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onPageChange(Page.TOURNAMENTS, `${mode.gameId || 'freefire'}?mode=${mode.id}`)}
              className="group relative rounded-xl sm:rounded-2xl overflow-hidden border border-[#1b2f56] hover:border-cyan-500/60 bg-[#071328] shadow-xl flex flex-col aspect-[1.58/1] cursor-pointer transition-all"
            >
              {/* Top Banner Artwork - Horizontal Rectangle */}
              <div className="relative flex-1 w-full overflow-hidden bg-black/60">
                <SafeImage
                  src={mode.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop'}
                  alt={mode.title}
                  className="w-full h-full"
                  imgClassName="group-hover:scale-105 transition-transform duration-500 object-cover"
                />

                {/* Cyber Cinematic Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#071328] via-black/40 to-black/30" />

                {/* Free Fire Max Tag */}
                <div className="absolute top-1.5 right-2 z-10 flex items-center gap-1">
                  <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-wider text-white bg-black/70 px-1.5 py-0.5 rounded border border-white/15 backdrop-blur-xs">
                    FREE FIRE MAX
                  </span>
                </div>

                {/* Stylized Esports Tournament Headline */}
                <div className="absolute inset-x-2 bottom-1.5 z-10 text-center">
                  <h3 className="text-[11px] sm:text-[13px] font-black italic uppercase tracking-tight text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] leading-tight line-clamp-2">
                    {bannerHeadline}
                  </h3>
                  <div className="flex items-center justify-center gap-1 mt-0.5 opacity-80">
                    <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-cyan-300 uppercase">
                      ARENA KHEL
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Solid Dark Navy Bar */}
              <div className="relative z-10 w-full bg-[#0d182e] border-t border-[#182a4d] px-2.5 py-1.5 sm:py-2 flex items-center justify-between">
                {/* Left: Mode Title */}
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-white truncate max-w-[70%]">
                  {mode.title}
                </span>

                {/* Right: Live Green Dot + Count */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
                  <span className="text-[10px] sm:text-xs font-black text-emerald-400 leading-none">
                    {displayCount}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
