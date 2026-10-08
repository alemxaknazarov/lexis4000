import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ArrowRight, Home, ChevronDown, ChevronUp, Sparkles, Check, Zap, BookOpen } from 'lucide-react';
import type { Word } from '../../lib/supabase';
import { sounds } from '../../utils/soundEffects';
import { stopAudio } from '../../utils/speech';

interface Phase6SummaryProps {
  words: Word[];
  bookNumber: number;
  unitNumber: number;
  earnedXp?: number;
  sessionAccuracy?: number;
  unitAccuracy?: number;
  unitLearnedCount?: number;
  isUnitCompleted?: boolean;
  onNextUnit: () => void;
  onRestart: () => void;
  onGoHome: () => void;
  onContinueUnit?: () => void;
}

export const Phase6Summary: React.FC<Phase6SummaryProps> = ({
  words,
  bookNumber,
  unitNumber,
  earnedXp,
  sessionAccuracy,
  unitAccuracy,
  unitLearnedCount,
  isUnitCompleted,
  onNextUnit,
  onRestart,
  onGoHome,
  onContinueUnit
}) => {
  const [showWordsList, setShowWordsList] = useState(false);

  useEffect(() => {
    stopAudio();
    sounds.playVictory();

    // Celebration confetti
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const maxPossibleXp = words.length;
  const xpEarned = earnedXp ?? maxPossibleXp;
  const sessionScore = sessionAccuracy ?? (maxPossibleXp > 0 ? Math.round((xpEarned / maxPossibleXp) * 100) : 100);
  const unitScore = unitAccuracy ?? 0;
  const isFullyFinished = isUnitCompleted ?? (unitScore >= 100);
  const learnedCount = unitLearnedCount ?? words.length;

  return (
    <div className="py-2 sm:py-6 px-3.5 sm:px-4 max-w-sm sm:max-w-md mx-auto flex flex-col items-center animate-fadeIn">
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Subtle Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Celebration Trophy Icon with Dual-Tone Glow */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-emerald-400 p-0.5 shadow-lg shadow-amber-500/25 mb-3 flex items-center justify-center">
          <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-amber-500 dark:text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Unit & Book Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Book {bookNumber} • Unit {unitNumber}</span>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
          {isFullyFinished ? 'Unit Yakunlandi! 🎉' : 'Natijalar Tayyor! ✨'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs leading-relaxed">
          Barcha <strong className="text-slate-700 dark:text-slate-200">{words.length} ta so‘z</strong> 5 ta bosqichdan muvaffaqiyatli o‘tkazildi.
        </p>

        {/* Stylish 3-Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 w-full mb-4">
          <div className="p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Aniqlik
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              {sessionScore}%
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Tajriba</span>
            </span>
            <span className="text-base sm:text-lg font-black text-amber-500">
              +{xpEarned} XP
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-blue-500" />
              <span>Unit</span>
            </span>
            <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
              {learnedCount}/20
            </span>
          </div>
        </div>

        {/* Collapsible Words List */}
        <div className="w-full mb-4">
          <button
            type="button"
            onClick={() => setShowWordsList((prev) => !prev)}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800/70 text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center justify-between transition cursor-pointer"
          >
            <span>So‘zlar ro‘yxati ({words.length} ta)</span>
            {showWordsList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showWordsList && (
            <div className="mt-2 p-2.5 max-h-36 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 flex flex-wrap gap-1.5 text-left animate-fadeIn">
              {words.map((w) => (
                <span
                  key={w.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-700 dark:text-slate-300 shadow-2xs"
                >
                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                  <strong className="capitalize">{w.word}</strong>
                  <span className="text-slate-400 text-[10px]">({w.translation_uz})</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          {/* Primary Action Button */}
          {!isFullyFinished && onContinueUnit ? (
            <button
              type="button"
              onClick={onContinueUnit}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Qolgan so‘zlarni o‘rganish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onNextUnit}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Keyingi Unitga o‘tish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Secondary Actions: 2 Columns */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              type="button"
              onClick={onRestart}
              className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Qayta o‘qish</span>
            </button>

            <button
              type="button"
              onClick={onGoHome}
              className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Bosh sahifa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
