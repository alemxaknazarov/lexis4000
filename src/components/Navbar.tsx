import { Flame, Award, Sun, Moon, User, Trophy } from 'lucide-react';
import type { UserProfile } from '../lib/supabase';

interface NavbarProps {
  currentView: string;
  onBack?: () => void;
  onGoHome: () => void;
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
  xp: number;
  streak: number;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView: _currentView,
  onBack: _onBack,
  onGoHome,
  userProfile,
  onOpenAuth,
  onOpenProfile,
  onOpenLeaderboard,
  xp,
  streak,
  isDark,
  onToggleTheme
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        
        {/* Left: Brand Logo (Always in consistent position) */}
        <div
          className="flex items-center cursor-pointer select-none py-1 shrink-0"
          onClick={onGoHome}
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

        {/* Right: Metrics, Theme Switcher & Auth (Super responsive) */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Streak indicator */}
          <div
            title={`${streak} kun ketma-ket`}
            className="flex items-center gap-0.5 sm:gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 sm:py-1 rounded-lg text-xs font-semibold"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
            <span className="font-mono text-[11px] sm:text-xs">{streak}</span>
            <span className="hidden sm:inline font-normal">kun</span>
          </div>

          {/* XP indicator */}
          <div
            title={`${xp} Tajriba ochkosi`}
            className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 sm:py-1 rounded-lg text-xs font-medium"
          >
            <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-mono text-[11px] sm:text-xs">{xp}</span>
            <span className="hidden sm:inline font-normal text-slate-400">XP</span>
          </div>

          {/* Leaderboard Trophy Button */}
          <button
            onClick={onOpenLeaderboard}
            title="Reyting (Top o‘quvchilar)"
            className="w-7 h-7 sm:w-auto sm:h-auto flex items-center justify-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-800/60 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">Reyting</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            title={isDark ? "Yorug' rejim" : "Qorong'u rejim"}
            aria-label="Rejimni o'zgartirish"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer shrink-0"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
          </button>

          {/* User Auth Button */}
          {userProfile ? (
            <div className="flex items-center pl-1 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={onOpenProfile}
                title="Profil sahifasi"
                className="flex items-center gap-1.5 px-1.5 sm:px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0">
                  {userProfile.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline text-xs font-semibold max-w-[100px] truncate">
                  {userProfile.full_name}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              title="Hisobga kirish"
              className="w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kirish</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
