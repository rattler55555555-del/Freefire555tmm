import React, { useState, useEffect } from 'react';
import { Coins, Bell, MessageSquare } from 'lucide-react';
import { Page, User } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';

interface HomeHeaderProps {
  user: User;
  onPageChange: (page: Page, id?: string) => void;
  onOpenNotifications?: () => void;
}

export default function HomeHeader({ user, onPageChange, onOpenNotifications }: HomeHeaderProps) {
  const displayName = user?.username || 'Arena Khel';
  const totalBalance = (user?.wallet?.deposit || 0) + (user?.wallet?.winnings || 0) + (user?.wallet?.bonus || 0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), limit(15));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!user?.id) {
        setUnreadCount(snapshot.size);
        return;
      }
      let unread = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (!data.readBy || !data.readBy.includes(user.id)) {
          unread++;
        }
      });
      setUnreadCount(unread);
    }, (err) => {
      // ignore
    });

    return () => unsub();
  }, [user?.id]);

  return (
    <header className="px-4 sm:px-5 pt-3 pb-1">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Circular Avatar / Arena Khel Gaming Logo Badge */}
        <div 
          onClick={() => onPageChange(Page.PROFILE)}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform shrink-0"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-b from-[#162238] to-[#0a1220] p-0.5 border border-cyan-500/40 shadow-lg shadow-cyan-500/10 flex items-center justify-center overflow-hidden">
            <img
              src="/arena_khel_logo.png"
              alt="Arena Khel"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="hidden xs:flex flex-col text-left">
            <span className="text-[10px] font-black tracking-wider text-cyan-400 leading-none">ARENA</span>
            <span className="text-[9px] font-black tracking-wider text-orange-500 leading-none mt-0.5">KHEL</span>
          </div>
        </div>

        {/* Center: Welcome Back & User / App Name */}
        <div className="text-center flex-1 px-1 min-w-0">
          <p className="text-[11px] sm:text-xs font-medium text-slate-300 tracking-tight leading-tight">
            Welcome Back,
          </p>
          <h1 className="text-sm sm:text-base font-black text-white tracking-wide leading-tight truncate max-w-[180px] mx-auto mt-0.5">
            {displayName}
          </h1>
        </div>

        {/* Right: WhatsApp Support + Notifications Bell + Balance Card */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* WhatsApp Support Team & Channel */}
          <a
            href="https://whatsapp.com/channel/0029Vb8LgeD0QeasJdM18j38"
            target="_blank"
            rel="noopener noreferrer"
            title="Arena Khel WhatsApp Support & Channel"
            className="w-9 h-9 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 flex items-center justify-center active:scale-95 transition-all shadow-sm"
          >
            <MessageSquare size={17} className="stroke-[2.2]" />
          </a>

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative w-9 h-9 rounded-xl bg-[#0f1d3b] hover:bg-[#162a54] border border-[#223963] text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm"
              title="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-black flex items-center justify-center shadow-md animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* White Balance Card Pill with Gold Coin */}
          <button
            onClick={() => onPageChange(Page.WALLET)}
            className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-xs flex items-center justify-center text-black font-black text-[10px] leading-none shrink-0">
              🪙
            </div>
            <span className="text-xs sm:text-sm font-black text-[#0f172a] tracking-tight">
              {totalBalance.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
