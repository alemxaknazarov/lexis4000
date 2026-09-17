import React, { useState, useRef, useEffect } from 'react';
import { X, Send, ShieldCheck, CheckCircle, AlertCircle, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';
import type { UserProfile } from '../lib/supabase';
import { sounds } from '../utils/soundEffects';
import { saveSession } from '../utils/sessionManager';
import { verifyTelegramOtp } from '../utils/telegramAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setErrorMsg(null);
      setSuccessMsg(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      setErrorMsg('Iltimos, 6 xonali tasdiqlash kodini to‘liq kiriting.');
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
        onClose();
      }, 700);

    } catch (err: any) {
      sounds.playWrong();
      setErrorMsg(err.message || 'Tasdiqlashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Yopish"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-3">
            <Send className="w-6 h-6 rotate-[-20deg]" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
            <span>Telegram orqali kirish</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Parol eslab qolish shart emas. 6 xonali kod bilan tezkor kiring.
          </p>
        </div>

        {/* Step 1: Open Bot Button */}
        <div className="mb-5">
          <a
            href="https://t.me/lexis4000_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>1. Telegram botga o‘tish (@lexis4000_bot)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
          <p className="text-[11px] text-slate-400 text-center mt-1.5">
            Botda <b>«📱 Telefon raqamni yuborish»</b> tugmasini bosing
          </p>
        </div>

        {/* Step 2: 6-Digit Code Input */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-2 text-center">
            2. Botdan olingan 6 xonali kodni kiriting:
          </label>

          <div 
            onClick={() => inputRef.current?.focus()}
            className="relative flex items-center justify-center gap-2 cursor-text select-none"
          >
            {/* Hidden Master Native Input */}
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

            {/* 6 Visual Display Slots */}
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const char = code[idx] || '';
              const isActive = isFocused && (code.length === idx || (code.length === 6 && idx === 5));

              return (
                <div
                  key={idx}
                  className={`w-10 h-12 sm:w-11 sm:h-13 flex items-center justify-center font-mono font-extrabold text-xl rounded-xl border transition-all duration-150 ${
                    isActive
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.03] bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                      : char
                      ? 'border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white'
                  }`}
                >
                  {char ? (
                    <span>{char}</span>
                  ) : isActive ? (
                    <span className="w-0.5 h-5 bg-emerald-500 animate-pulse" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={() => verifyCode()}
          disabled={loading || code.length !== 6}
          className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            code.length === 6 && !loading
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Tekshirilmoqda...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Tasdiqlash va Kirish</span>
            </>
          )}
        </button>

        {/* Guest Mode */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
          >
            Mehmon sifatida davom etish
          </button>
        </div>
      </div>
    </div>
  );
};
