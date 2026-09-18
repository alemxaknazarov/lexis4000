import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, RefreshCw, ArrowLeft, Trophy } from 'lucide-react';
import type { UserProfile } from '../lib/supabase';
import { sounds } from '../utils/soundEffects';
import { saveSession } from '../utils/sessionManager';
import { verifyTelegramOtp } from '../utils/telegramAuth';

interface LoginPageProps {
  onSuccess: (profile: UserProfile) => void;
  onGoHome: () => void;
  onOpenLeaderboard: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onGoHome,
  onOpenLeaderboard
}) => {
  const [code, setCode] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus single input on mount
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(rawVal);
    setErrorMsg(null);

    if (rawVal.length === 6) {
      verifyCode(rawVal);
    }
  };

  const verifyCode = async (codeToVerify?: string) => {
    const codeVal = codeToVerify || code;
    if (codeVal.length !== 6) {
      setErrorMsg('Iltimos, 6 xonali kodni to‘liq kiriting.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const finalProfile = await verifyTelegramOtp(codeVal);
      saveSession(finalProfile);

      sounds.playCorrect();
      setSuccessMsg('Muvaffaqiyatli kirdingiz!');

      setTimeout(() => {
        onSuccess(finalProfile);
      }, 500);
    } catch (err: any) {
      sounds.playWrong();
      setErrorMsg(err.message || 'Tasdiqlashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* 1. Standard Top Navigation Bar (Identical height & logo placement to main Navbar) */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Brand Logo - exactly identical positioning */}
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

          {/* Center Links (Minimalist style) */}
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

          {/* Right: Home Back */}
          <div className="flex items-center gap-1.5 sm:gap-2">
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

      {/* 2. Main Login Form with comfortable space below fixed navbar */}
      <main className="flex-1 pt-20 sm:pt-24 pb-12 sm:pb-20 flex flex-col items-center justify-center px-4 text-center animate-fadeIn">
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
          {/* Central Brand Logo */}
          <div className="mb-6 select-none flex items-center justify-center transition-transform hover:scale-105">
            <img
              src="/logo.png"
              alt="LEXIS 4000"
              className="h-16 sm:h-20 w-auto object-contain dark:hidden"
            />
            <img
              src="/logo-dark.png"
              alt="LEXIS 4000"
              className="h-16 sm:h-20 w-auto object-contain hidden dark:block"
            />
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Kodni Kiriting
          </h1>

          {/* Subtitle with underlined Telegram bot link */}
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
            <a
              href="https://t.me/lexis4000_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 decoration-slate-400 dark:decoration-slate-600 transition"
            >
              @lexis4000_bot
            </a>{' '}
            telegram botiga kiring va 3 daqiqalik kodingizni oling.
          </p>

          {/* 6 Clean Rounded Slots with a Single Unflickering Master Input */}
          <div 
            onClick={() => inputRef.current?.focus()}
            className="relative flex items-center justify-center gap-2 sm:gap-3 mb-6 cursor-text select-none"
          >
            {/* Hidden Single Input that handles all keystrokes and keeps keyboard steadily open */}
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text"
              aria-label="6 xonali tasdiqlash kodi"
            />

            {/* 6 Visual Display Boxes */}
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const char = code[idx] || '';
              const isActive = isFocused && (code.length === idx || (code.length === 6 && idx === 5));

              return (
                <div
                  key={idx}
                  className={`w-11 h-14 sm:w-13 sm:h-16 flex items-center justify-center font-mono font-bold text-xl sm:text-2xl rounded-2xl border transition-all duration-150 shadow-2xs ${
                    isActive
                      ? 'border-slate-900 dark:border-white ring-2 ring-slate-900/10 dark:ring-white/20 scale-[1.03] bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                      : char
                      ? 'border-emerald-500/80 dark:border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white'
                  }`}
                >
                  {char ? (
                    <span>{char}</span>
                  ) : isActive ? (
                    <span className="w-0.5 h-6 bg-slate-900 dark:bg-white animate-pulse" />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Feedback states */}
          {loading && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Tekshirilmoqda...</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Link to open bot */}
          <div className="pt-2">
            <a
              href="https://t.me/lexis4000_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition font-medium"
            >
              <span>Kod kelmadimi? Botni ochish</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </a>
          </div>
        </div>
      </main>

      {/* 3. Minimal Footer */}
      <footer className="w-full py-5 border-t border-slate-200/70 dark:border-slate-800/70 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
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
