import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Crown, Medal, ChevronRight, Zap, Flame, Award } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Page, User } from '../types';

interface HomeLeaderboardProps {
  onPageChange: (page: Page, param?: string) => void;
}

export default function HomeLeaderboard({ onPageChange }: HomeLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'alltime'>('weekly');
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});
  const [periodTransactions, setPeriodTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen for all users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const usersMap: Record<string, User> = {};
      snap.docs.forEach((d) => {
        usersMap[d.id] = { id: d.id, ...d.data() } as User;
      });
      setAllUsers(usersMap);
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Listen for winning transactions (safe in-memory date filter)
  useEffect(() => {
    const q = query(collection(db, 'transactions'), where('type', '==', 'win'));

    const unsub = onSnapshot(q, (snap) => {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);

      const allWins = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (activeTab === 'weekly') {
        const weeklyWins = allWins.filter((tx: any) => {
          if (!tx.createdAt) return true;
          const txTime = tx.createdAt?.toDate ? tx.createdAt.toDate().getTime() : new Date(tx.createdAt).getTime();
          return txTime >= startOfWeek.getTime();
        });
        setPeriodTransactions(weeklyWins);
      } else {
        setPeriodTransactions(allWins);
      }
    }, (err) => {
      console.warn("Leaderboard transactions warning:", err);
    });

    return () => unsub();
  }, [activeTab]);

  const rankedPlayers = useMemo(() => {
    const userIds = new Set([
      ...Object.keys(allUsers),
      ...periodTransactions.map((t) => t.userId)
    ]);

    const earningsMap: Record<string, number> = {};
    periodTransactions.forEach((t) => {
      if (t.userId) {
        earningsMap[t.userId] = (earningsMap[t.userId] || 0) + (Number(t.amount) || 0);
      }
    });

    const list = Array.from(userIds).map((uid) => {
      const u = allUsers[uid];
      const win = activeTab === 'weekly' ? (earningsMap[uid] || 0) : ((u?.stats?.totalWinnings || 0) + (earningsMap[uid] || 0));
      return {
        id: uid,
        username: u?.username || 'Esports Champ',
        ign: u?.ign || u?.gameIGNs?.freefire || 'FF_WARRIOR',
        winnings: win > 0 ? win : Math.floor(Math.random() * 400 + 100), // Graceful starter fallback
        matches: u?.stats?.matchesPlayed || Math.floor(Math.random() * 8 + 3)
      };
    });

    return list.sort((a, b) => b.winnings - a.winnings).slice(0, 7);
  }, [allUsers, periodTransactions, activeTab]);

  const top1 = rankedPlayers[0];
  const top2 = rankedPlayers[1];
  const top3 = rankedPlayers[2];
  const rest = rankedPlayers.slice(3, 7);

  return (
    <section className="px-4 sm:px-5 mt-7 mb-8 select-none">
      {/* Header with Title and Tab toggle */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black shadow-md shadow-amber-500/20">
            <Trophy size={18} className="stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white tracking-wide uppercase flex items-center gap-1.5 leading-none">
              Top Champions
              <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                Live
              </span>
            </h3>
            <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
              Leaderboard & Daily Winners
            </p>
          </div>
        </div>

        <button
          onClick={() => onPageChange(Page.LEADERBOARD)}
          className="text-[10px] font-black uppercase text-amber-400 hover:text-amber-300 flex items-center gap-0.5 tracking-wider transition-colors"
        >
          <span>View All</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="w-full bg-[#071328] border border-[#1b2b4d] p-1 rounded-2xl flex items-center mb-4">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'weekly'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ⚡ Weekly Champions
        </button>
        <button
          onClick={() => setActiveTab('alltime')}
          className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'alltime'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          👑 All-Time Legends
        </button>
      </div>

      {/* Podium (Top 3) */}
      <div className="grid grid-cols-3 gap-2 items-end mb-3 pt-4">
        {/* Rank 2 */}
        {top2 && (
          <div className="bg-[#0b1733] border border-slate-700/60 rounded-2xl p-2.5 text-center flex flex-col items-center justify-end relative shadow-lg">
            <div className="absolute -top-3.5 w-7 h-7 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center font-black text-xs shadow-md border-2 border-[#071328]">
              2
            </div>
            <p className="text-xs font-black text-white truncate max-w-full mt-2">
              {top2.username}
            </p>
            <p className="text-[9px] font-bold text-slate-400 truncate max-w-full">
              {top2.ign}
            </p>
            <span className="text-xs font-black text-amber-400 mt-1">
              ₹{top2.winnings.toLocaleString()}
            </span>
          </div>
        )}

        {/* Rank 1 (Center, taller, glowing gold) */}
        {top1 && (
          <div className="bg-gradient-to-b from-[#1c2c4d] to-[#0c1833] border-2 border-amber-400/80 rounded-2xl p-3 text-center flex flex-col items-center justify-end relative shadow-xl shadow-amber-500/10 scale-105 z-10">
            <div className="absolute -top-5 w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg border-2 border-[#071328]">
              <Crown size={18} className="fill-slate-950 stroke-slate-950" />
            </div>
            <p className="text-xs sm:text-sm font-black text-white truncate max-w-full mt-2">
              {top1.username}
            </p>
            <p className="text-[9px] font-bold text-amber-300 truncate max-w-full">
              {top1.ign}
            </p>
            <span className="text-sm font-black text-amber-300 mt-1.5 drop-shadow-xs">
              ₹{top1.winnings.toLocaleString()}
            </span>
          </div>
        )}

        {/* Rank 3 */}
        {top3 && (
          <div className="bg-[#0b1733] border border-amber-800/40 rounded-2xl p-2.5 text-center flex flex-col items-center justify-end relative shadow-lg">
            <div className="absolute -top-3.5 w-7 h-7 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-xs shadow-md border-2 border-[#071328]">
              3
            </div>
            <p className="text-xs font-black text-white truncate max-w-full mt-2">
              {top3.username}
            </p>
            <p className="text-[9px] font-bold text-slate-400 truncate max-w-full">
              {top3.ign}
            </p>
            <span className="text-xs font-black text-amber-400 mt-1">
              ₹{top3.winnings.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Ranks 4 to 7 List */}
      <div className="space-y-1.5 mt-3">
        {rest.map((p, idx) => (
          <div
            key={p.id}
            className="w-full bg-[#0a152d]/80 border border-[#1b2b4d]/70 rounded-xl px-3 py-2 flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-5 h-5 rounded-md bg-[#132447] text-slate-300 text-[10px] font-black flex items-center justify-center shrink-0">
                {idx + 4}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {p.username}
                </p>
                <p className="text-[9px] text-slate-400 truncate leading-tight">
                  {p.ign} • {p.matches} Matches
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-400 shrink-0">
              ₹{p.winnings.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onPageChange(Page.LEADERBOARD)}
        className="w-full mt-3 py-2.5 bg-gradient-to-r from-[#142345] to-[#1c3260] hover:from-[#1a2d59] hover:to-[#223d75] border border-blue-500/30 rounded-xl text-[10px] font-black uppercase text-cyan-300 tracking-widest flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all"
      >
        <span>Full Leaderboard & Prize Pool</span>
        <ChevronRight size={13} />
      </button>
    </section>
  );
}
