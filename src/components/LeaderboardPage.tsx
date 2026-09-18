import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Trophy, Award, RefreshCw 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/supabase';

interface LeaderboardUser {
  id: string;
  full_name: string;
  total_xp: number;
  avatar_url?: string;
  last_study_date?: string;
  created_at?: string;
}

interface LeaderboardPageProps {
  currentUser: UserProfile | null;
  onGoHome: () => void;
  onGoBack: () => void;
  onOpenAuth: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  currentUser,
  onGoHome,
  onGoBack,
  onOpenAuth
}) => {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      // Privacy-first: strictly select ONLY id, full_name, total_xp, avatar_url, last_study_date, created_at
      // No telegram_id, phone_number, or username are queried
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, total_xp, avatar_url, last_study_date, created_at')
        .order('total_xp', { ascending: false })
        .order('last_study_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        // Strict deterministic sort:
        // 1. Primary: total_xp descending (higher score is always higher)
        // 2. Tie-breaker: whoever earned that score most recently (last_study_date or created_at) is placed higher
        const sorted = [...data].sort((a, b) => {
          if (b.total_xp !== a.total_xp) {
            return b.total_xp - a.total_xp;
          }
          const timeA = new Date(a.last_study_date || a.created_at || 0).getTime();
          const timeB = new Date(b.last_study_date || b.created_at || 0).getTime();
          return timeB - timeA;
        });
        setLeaders(sorted);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Filter leaders by search query if user wants to find their name
  const filteredLeaders = leaders.filter((u) =>
    (u.full_name || 'O‘quvchi').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // User's own rank
  const myRankIndex = leaders.findIndex((u) => currentUser && u.id === currentUser.id);
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : null;

  // Top 3 Podium
  const top1 = leaders[0];
  const top2 = leaders[1];
  const top3 = leaders[2];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-emerald-500/20">
      {/* 1. Standard Top Navigation Bar (Identical height & logo placement to main Navbar) */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Left: Brand Logo (Always in consistent position) */}
          <div
            onClick={onGoHome}
            className="flex items-center cursor-pointer select-none py-1 shrink-0"
            title="Bosh sahifa"
          >
            <img
              src="/logo.png"
              alt="LEXIS 4000"
              className="h-7 sm:h-9 w-auto object-contain dark:hidden transition-transform hover:scale-105"
            />
            <img
              src="/logo-dark.png"
              alt="LEXIS 4000"
              className="h-7 sm:h-9 w-auto object-contain hidden dark:block transition-transform hover:scale-105"
            />
          </div>

          {/* Right Action Controls: Orqaga */}
          <div className="flex items-center gap-2">
            {/* Back Button */}
            <button
              onClick={onGoBack}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Orqaga</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Leaderboard Page Content with Full Native Document Scroll */}
      <main className="flex-1 pt-20 sm:pt-24 pb-16 max-w-4xl w-full mx-auto px-4 sm:px-6 animate-fadeIn">
        {/* Hero Banner */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 shadow-md shadow-amber-500/10 mb-3 text-amber-500">
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            O‘quvchilar Reytingi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
            Eng ko‘p so‘z o‘zlashtirgan va yuqori XP to‘plagan bilimdonlar ligasi
          </p>
        </div>

        {/* Current User Floating Banner (If user is logged in) */}
        {currentUser && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-base shrink-0 border border-white/20">
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  myRank ? `#${myRank}` : '—'
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-extrabold truncate">
                    {currentUser.full_name}
                  </span>
                  <span className="text-[10px] font-bold bg-white text-emerald-800 px-1.5 py-0.2 rounded-md uppercase">
                    Siz {myRank ? `#${myRank}` : ''}
                  </span>
                </div>
                <p className="text-xs text-emerald-100 truncate">
                  {myRank ? `Siz ${myRank}-o‘rinda turibsiz` : 'Faoliyat boshlash uchun unitlarni yakunlang'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white/15 px-3 py-1.5 rounded-xl font-mono font-bold text-sm shrink-0 border border-white/20">
              <Award className="w-4 h-4 text-amber-300" />
              <span>{currentUser.total_xp || 0} XP</span>
            </div>
          </div>
        )}

        {/* Guest Banner */}
        {!currentUser && (
          <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Reytingda o‘z o‘rningizni ko‘rmoqchimisiz?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Telegram hisobingiz orqali kiring va to‘plagan XP laringizni saqlang
              </p>
            </div>
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shrink-0 cursor-pointer shadow-sm"
            >
              Kirish
            </button>
          </div>
        )}

        {/* Top 3 Visual Podium (When at least 3 users exist) */}
        {!loading && leaders.length >= 3 && (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-8 items-end max-w-xl mx-auto pt-4">
            {/* 2nd Place (Silver) */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center font-extrabold text-lg sm:text-xl text-slate-700 dark:text-slate-200 shadow-sm">
                  {top2.avatar_url ? (
                    <img src={top2.avatar_url} alt={top2.full_name} className="w-full h-full object-cover" />
                  ) : (
                    top2.full_name?.charAt(0).toUpperCase() || '2'
                  )}
                </div>
                <span className="absolute -bottom-2 -right-1 text-base sm:text-lg">🥈</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[90px] sm:max-w-[130px] text-center">
                {top2.full_name}
              </span>
              <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                {top2.total_xp || 0} XP
              </span>
              <div className="w-full h-16 sm:h-20 mt-2 rounded-t-xl bg-slate-200/70 dark:bg-slate-800/60 border-t border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-500 text-sm">
                2
              </div>
            </div>

            {/* 1st Place (Gold) - Elevated */}
            <div className="flex flex-col items-center -mt-4">
              <div className="relative mb-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300 text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl shadow-lg shadow-amber-500/20">
                  {top1.avatar_url ? (
                    <img src={top1.avatar_url} alt={top1.full_name} className="w-full h-full object-cover" />
                  ) : (
                    top1.full_name?.charAt(0).toUpperCase() || '1'
                  )}
                </div>
                <span className="absolute -bottom-2 -right-1 text-xl sm:text-2xl">🥇</span>
              </div>
              <span className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-[150px] text-center">
                {top1.full_name}
              </span>
              <span className="text-xs sm:text-sm font-mono font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                {top1.total_xp || 0} XP
              </span>
              <div className="w-full h-24 sm:h-28 mt-2 rounded-t-xl bg-amber-500/15 border-t border-amber-400/50 flex items-center justify-center font-extrabold text-amber-600 text-base">
                1
              </div>
            </div>

            {/* 3rd Place (Bronze) */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-amber-900/10 dark:bg-amber-900/30 border-2 border-amber-700/40 flex items-center justify-center font-extrabold text-lg sm:text-xl text-amber-800 dark:text-amber-400 shadow-sm">
                  {top3.avatar_url ? (
                    <img src={top3.avatar_url} alt={top3.full_name} className="w-full h-full object-cover" />
                  ) : (
                    top3.full_name?.charAt(0).toUpperCase() || '3'
                  )}
                </div>
                <span className="absolute -bottom-2 -right-1 text-base sm:text-lg">🥉</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[90px] sm:max-w-[130px] text-center">
                {top3.full_name}
              </span>
              <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                {top3.total_xp || 0} XP
              </span>
              <div className="w-full h-12 sm:h-16 mt-2 rounded-t-xl bg-amber-900/10 dark:bg-amber-900/20 border-t border-amber-700/30 flex items-center justify-center font-bold text-amber-800/70 text-sm">
                3
              </div>
            </div>
          </div>
        )}

        {/* Controls Bar: Search & Refresh */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ism bo‘yicha qidirish..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-900 dark:text-white"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500">
            <span>Jami: <b>{leaders.length}</b> nafar o‘quvchi</span>
            <button
              onClick={fetchLeaders}
              title="Reytingni yangilash"
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
              <span>Yangilash</span>
            </button>
          </div>
        </div>

        {/* Full Leaderboard List Container (Smooth Native Scroll) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 sm:p-5 shadow-xs transition-colors">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-7 h-7 animate-spin text-emerald-600" />
              <span className="text-sm font-medium">Reyting yuklanmoqda...</span>
            </div>
          ) : filteredLeaders.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              {searchQuery ? 'Bunday ismli o‘quvchi topilmadi.' : 'Hozircha reytingda o‘quvchilar yo‘q.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLeaders.map((user, index) => {
                const rank = index + 1;
                const isMe = currentUser?.id === user.id;

                let rankVisual = (
                  <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {rank}
                  </span>
                );

                if (rank === 1) {
                  rankVisual = (
                    <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold text-sm flex items-center justify-center border border-amber-300 dark:border-amber-700 shadow-xs shrink-0">
                      🥇
                    </span>
                  );
                } else if (rank === 2) {
                  rankVisual = (
                    <span className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center border border-slate-300 dark:border-slate-600 shadow-xs shrink-0">
                      🥈
                    </span>
                  );
                } else if (rank === 3) {
                  rankVisual = (
                    <span className="w-7 h-7 rounded-lg bg-amber-900/10 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 font-bold text-sm flex items-center justify-center border border-amber-600/30 shadow-xs shrink-0">
                      🥉
                    </span>
                  );
                }

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all ${
                      isMe
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Left: Rank, Avatar & Name ONLY */}
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      {rankVisual}

                      {/* Name Avatar / 3D Character */}
                      <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          user.full_name?.charAt(0).toUpperCase() || 'O'
                        )}
                      </div>

                      {/* ONLY Full Name — No Telegram username or sensitive info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user.full_name || 'O‘quvchi'}
                          </span>
                          {isMe && (
                            <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.2 rounded shrink-0">
                              Siz
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: ONLY XP Score */}
                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-xl text-xs font-mono font-bold shrink-0">
                      <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{user.total_xp || 0} XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full py-5 sm:py-6 text-center border-t border-slate-200/70 dark:border-slate-800/70 text-xs text-slate-400 dark:text-slate-500 font-medium">
        <p className="flex items-center justify-center gap-1">
          <span>made by</span>
          <a
            href="https://t.me/alem_42"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2"
          >
            alem
          </a>
        </p>
      </footer>
    </div>
  );
};
