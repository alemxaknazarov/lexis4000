import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, RefreshCw, Sun, Moon, ArrowLeft, Trophy } from 'lucide-react';
import type { UserProfile } from '../lib/supabase';
import { sounds } from '../utils/soundEffects';
import { saveSession } from '../utils/sessionManager';
import { verifyTelegramOtp } from '../utils/telegramAuth';

interface LoginPageProps {
  onSuccess: (profile: UserProfile) => void;
  onGoHome: () => void;
  onOpenLeaderboard: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onGoHome,
  onOpenLeaderboard,
  isDark,
  onToggleTheme
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto-advance
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are typed
    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    setErrorMsg(null);

    if (pasted.length === 6) {
      verifyCode(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const verifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length !== 6) {
      setErrorMsg('Iltimos, 6 xonali kodni to‘liq kiriting.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const finalProfile = await verifyTelegramOtp(code);
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

          {/* Right: Theme Toggle & Home Back */}
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

          {/* 6 Clean Rounded Input Slots (Identical to 42.uz) */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-11 h-14 sm:w-13 sm:h-16 text-center font-mono font-bold text-xl sm:text-2xl rounded-2xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:border-slate-900 dark:focus:border-white focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 outline-none transition shadow-2xs"
              />
            ))}
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
        <p>lexis.uz 2026</p>
      </footer>
    </div>
  );
};
