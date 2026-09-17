import React from 'react';
import { BookOpen, Settings, Trophy, AlertTriangle, User } from 'lucide-react';
import type { AppView } from '../router/routes';
import type { UserProfile } from '../lib/supabase';
import { sounds } from '../utils/soundEffects';

interface MobileBottomNavProps {
  currentView: AppView;
  onGoHome: () => void;
  onOpenSettings: () => void;
  onOpenLeaderboard: () => void;
  mistakeCount: number;
  onOpenMistakes: () => void;
  userProfile: UserProfile | null;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onGoHome,
  onOpenSettings,
  onOpenLeaderboard,
  mistakeCount,
  onOpenMistakes,
  userProfile,
  onOpenProfile,
  onOpenAuth
}) => {
  const isHomeActive = currentView === 'catalog' || currentView === 'units' || currentView === 'words';
  const isSettingsActive = currentView === 'settings';
  const isLeaderboardActive = currentView === 'leaderboard';
  const isMistakesActive = currentView === 'mistakes';
  const isProfileActive = currentView === 'profile' || currentView === 'login';

  const handleNav = (action: () => void) => {
    sounds.playClick();
    action();
  };

  return (
    <nav
      aria-label="Mobil pastki navigatsiya"
      className="sm:hidden fixed bottom-3 left-3 right-3 z-50 max-w-md mx-auto rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/85 border border-white/70 dark:border-slate-800/90 shadow-2xl shadow-slate-950/15 dark:shadow-black/60 px-2 py-1.5 transition-all"
    >
      <div className="flex items-center justify-around gap-1">
        {/* 1. Kitoblar (Bosh sahifa) */}
        <button
          type="button"
          onClick={() => handleNav(onGoHome)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer active:scale-90 ${
            isHomeActive
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <div className="relative">
            <BookOpen className={`w-5 h-5 transition-transform ${isHomeActive ? 'scale-110' : ''}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-sans">Kitoblar</span>
          {isHomeActive && (
            <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5" />
          )}
        </button>

        {/* 2. Sozlamalar */}
        <button
          type="button"
          onClick={() => handleNav(onOpenSettings)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer active:scale-90 ${
            isSettingsActive
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <div className="relative">
            <Settings className={`w-5 h-5 transition-transform ${isSettingsActive ? 'scale-110' : ''}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-sans">Sozlamalar</span>
          {isSettingsActive && (
            <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5" />
          )}
        </button>

        {/* 3. Reyting (O'rtada) */}
        <button
          type="button"
          onClick={() => handleNav(onOpenLeaderboard)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer active:scale-90 ${
            isLeaderboardActive
              ? 'text-amber-500 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <div className="relative">
            <Trophy className={`w-5 h-5 transition-transform ${isLeaderboardActive ? 'scale-110 text-amber-500' : ''}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-sans">Reyting</span>
          {isLeaderboardActive && (
            <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
          )}
        </button>

        {/* 4. Xatolar (Faqat xato bor bo'lsa paydo bo'ladi) */}
        {mistakeCount > 0 && (
          <button
            type="button"
            onClick={() => handleNav(onOpenMistakes)}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer active:scale-90 animate-fadeIn ${
              isMistakesActive
                ? 'text-rose-600 dark:text-rose-400 font-bold'
                : 'text-rose-500/80 dark:text-rose-400/80 font-medium'
            }`}
          >
            <div className="relative">
              <AlertTriangle className={`w-5 h-5 transition-transform ${isMistakesActive ? 'scale-110' : ''}`} />
              <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center px-0.5 shadow-xs animate-pulse">
                {mistakeCount}
              </span>
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-sans">Xatolar</span>
            {isMistakesActive && (
              <span className="w-1 h-1 rounded-full bg-rose-500 mt-0.5" />
            )}
          </button>
        )}

        {/* 5. Profil (O'ng tomonda) */}
        <button
          type="button"
          onClick={() => handleNav(userProfile ? onOpenProfile : onOpenAuth)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer active:scale-90 ${
            isProfileActive
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <div className="relative">
            {userProfile?.avatar_url ? (
              <div className={`w-5 h-5 rounded-full overflow-hidden border transition-transform ${
                isProfileActive
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-110'
                  : 'border-slate-300 dark:border-slate-700'
              }`}>
                <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <User className={`w-5 h-5 transition-transform ${isProfileActive ? 'scale-110' : ''}`} />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-sans">
            {userProfile ? 'Profil' : 'Kirish'}
          </span>
          {isProfileActive && (
            <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
