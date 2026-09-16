import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Sun, Moon, Flame, BookOpen, Trophy, 
  CheckCircle2, Sparkles, LogOut, ShieldCheck, Phone, 
  Send, Target, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile, UnitProgress, Book } from '../lib/supabase';

interface ProfilePageProps {
  userProfile: UserProfile;
  unitProgressList: UnitProgress[];
  books: Book[];
  onGoHome: () => void;
  onOpenLeaderboard: () => void;
  onSignOut: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userProfile,
  unitProgressList,
  books,
  onGoHome,
  onOpenLeaderboard,
  onSignOut,
  isDark,
  onToggleTheme
}) => {
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loadingRank, setLoadingRank] = useState<boolean>(true);

  // Calculate user rank from profiles
  useEffect(() => {
    const fetchRank = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, total_xp, telegram_id')
          .order('total_xp', { ascending: false });

        if (!error && data) {
          const index = data.findIndex(
            (p) => p.id === userProfile.id || (userProfile.telegram_id && p.telegram_id === userProfile.telegram_id)
          );
          if (index !== -1) {
            setUserRank(index + 1);
          } else {
            setUserRank(data.length + 1);
          }
        }
      } catch (err) {
        console.error('Failed to fetch rank:', err);
      } finally {
        setLoadingRank(false);
      }
    };
    fetchRank();
  }, [userProfile]);

  const completedUnitsCount = unitProgressList.filter((p) => p.is_completed).length;
  const totalUnits = 180; // 6 books * 30 units
  const totalXp = userProfile.total_xp || 0;
  const streak = userProfile.streak_days || 1;

  // Book-specific progress
  const getBookCompletedCount = (bookNumber: number) => {
    return unitProgressList.filter((p) => p.book_number === bookNumber && p.is_completed).length;
  };

  // Achievements Definition
  const achievements = [
    {
      id: 'first_step',
      title: 'Birinchi Qadam',
      desc: '1 ta unitni to‘liq o‘rganish',
      icon: '🚀',
      unlocked: completedUnitsCount >= 1
    },
    {
      id: 'streak_3',
      title: 'Olovli Start',
      desc: '3 kun ketma-ket shug‘ullanish',
      icon: '🔥',
      unlocked: streak >= 3
    },
    {
      id: 'xp_500',
      title: 'Bilimdon',
      desc: '500 XP to‘plash',
      icon: '⚡',
      unlocked: totalXp >= 500
    },
    {
      id: 'book_1_master',
      title: 'Elementary Ustasi',
      desc: '1-kitobni to‘liq tugatish',
      icon: '👑',
      unlocked: getBookCompletedCount(1) >= 30
    },
    {
      id: 'xp_1000',
      title: 'Leksika Elitasi',
      desc: '1000+ XP to‘plash',
      icon: '🌟',
      unlocked: totalXp >= 1000
    },
    {
      id: 'super_master',
      title: '4000 Fotihi',
      desc: 'Barcha 6 ta kitobni zabt etish',
      icon: '🏆',
      unlocked: completedUnitsCount >= 180
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* 1. Standard Top Navigation Bar (Identical height & logo placement to main Navbar) */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Brand Logo - identical positioning */}
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

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
            <button
              onClick={onGoHome}
              className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              Bosh sahifa
            </button>
            <button
              onClick={onGoHome}
              className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              Kitoblar
            </button>
            <button
              onClick={onOpenLeaderboard}
              className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Reyting</span>
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onToggleTheme}
              title={isDark ? "Yorug' rejim" : "Qorong'u rejim"}
              aria-label="Rejimni o'zgartirish"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer shrink-0"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              onClick={onGoHome}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Orqaga</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Profile Content with comfortable space below fixed navbar */}
      <main className="flex-1 pt-20 sm:pt-24 pb-12 sm:pb-16 max-w-5xl w-full mx-auto px-4 sm:px-6 animate-fadeIn">
        {/* User Identity Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs mb-8 transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Avatar Circle */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl shadow-md shadow-emerald-500/20 shrink-0">
                {userProfile.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>

              {/* User Details */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {userProfile.full_name}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Tasdiqlangan</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {userProfile.username && (
                    <span className="flex items-center gap-1">
                      <Send className="w-3 h-3 text-sky-500" />
                      <span>@{userProfile.username}</span>
                    </span>
                  )}
                  {userProfile.phone_number && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-500" />
                      <span>{userProfile.phone_number}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Hisobdan chiqish</span>
            </button>
          </div>
        </div>

        {/* 3. Core Stats Grid (4 Clean Metric Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {/* Stat 1: Total XP */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tajriba
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {totalXp}
            </p>
            <span className="text-[11px] text-slate-400">Umumiy XP ball</span>
          </div>

          {/* Stat 2: Streak */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Ketma-ketlik
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-500">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {streak}
            </p>
            <span className="text-[11px] text-slate-400">Kun faollik</span>
          </div>

          {/* Stat 3: Completed Units */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                O‘rganildi
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {completedUnitsCount}
              <span className="text-sm font-normal text-slate-400"> / {totalUnits}</span>
            </p>
            <span className="text-[11px] text-slate-400">Unit muvaffaqiyatli</span>
          </div>

          {/* Stat 4: Global Rank */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Reyting
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Trophy className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {loadingRank ? '-' : `#${userRank}`}
            </p>
            <span className="text-[11px] text-slate-400">O‘quvchilar orasida</span>
          </div>
        </div>

        {/* 4. Books Progress Matrix (6 Books) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs mb-8 transition-colors">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Kitoblar bo‘yicha taraqqiyot</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Barcha 6 ta kitobdagi 30 tadan unitning o‘zlashtirilishi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {books.map((b) => {
              const completed = getBookCompletedCount(b.book_number);
              const percentage = Math.round((completed / 30) * 100);

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                        {b.book_number}
                      </span>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {b.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                      {completed} / 30
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Achievements Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Yutuqlar va Nishonlar</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Darslarni muntazam bajarib nishonlarni qo‘lga kiriting
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  ach.unlocked
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-800/40 opacity-40 grayscale'
                }`}
              >
                <div className="text-3xl mb-2">{ach.icon}</div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-0.5">
                  {ach.title}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {ach.desc}
                </p>
                {ach.unlocked && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 mt-2 bg-emerald-100/60 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Ochildi
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 6. Footer */}
      <footer className="w-full py-5 border-t border-slate-200/70 dark:border-slate-800/70 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
        <p>lexis.uz 2026</p>
      </footer>
    </div>
  );
};
