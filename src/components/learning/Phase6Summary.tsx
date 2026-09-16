import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, RotateCcw, ArrowRight, Home, CheckCircle2, Sparkles } from 'lucide-react';
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
  useEffect(() => {
    stopAudio();
    sounds.playVictory();

    // Subtle celebration confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  }, []);

  const maxPossibleXp = words.length * 5;
  const xpEarned = earnedXp ?? maxPossibleXp;
  const sessionScore = sessionAccuracy ?? (maxPossibleXp > 0 ? Math.round((xpEarned / maxPossibleXp) * 100) : 100);
  const unitScore = unitAccuracy ?? 0;
  const isFullyFinished = isUnitCompleted ?? (unitScore >= 100);
  const learnedCount = unitLearnedCount ?? words.length;

  return (
    <div className="py-6 sm:py-10 px-4 max-w-lg mx-auto flex flex-col items-center text-center">
      {/* Badge */}
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
        <Award className="w-7 h-7" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-2">
        <Sparkles className="w-3 h-3" />
        <span>
          {isFullyFinished
            ? `Book ${bookNumber} • Unit ${unitNumber} To‘liq Yakunlandi! 🏆`
            : `Book ${bookNumber} • Unit ${unitNumber} (${unitScore}% • ${learnedCount}/20 so‘z)`}
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5">
        {isFullyFinished
          ? 'Muvaffaqiyatli Tugatildi! 🎉'
          : `${words.length} ta So‘z O‘zlashtirildi! ✨`}
      </h1>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
        {isFullyFinished
          ? `Tabriklaymiz! Siz ushbu unitdagi barcha 20 ta so‘zni to‘liq o‘rganib bo‘ldingiz.`
          : `Siz ${words.length} ta so‘zni barcha bosqichlardan o‘tkazdingiz. Unit umumiy o‘zlashtirilishi: ${unitScore}%.`}
      </p>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 w-full mb-6">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">O‘zlashtirish</span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {sessionScore}%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">To‘plangan Tajriba</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            +{xpEarned} XP
          </span>
        </div>
      </div>

      {/* Word Badges */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 text-left">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>O‘zlashtirilgan so‘zlar ({words.length} ta):</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {words.map((w) => (
            <span
              key={w.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
            >
              <strong className="capitalize">{w.word}</strong>
              <span className="text-slate-400 text-[10px]">• {w.translation_uz}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons: Compact & Mobile Optimized */}
      <div className="w-full flex flex-col gap-2.5">
        {/* Primary Action Button */}
        {!isFullyFinished && onContinueUnit ? (
          <button
            onClick={onContinueUnit}
            className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>Qolgan so‘zlar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onNextUnit}
            className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>Keyingi Unit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Secondary Actions: 2 Compact Grid Columns */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            onClick={onRestart}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Qayta</span>
          </button>

          <button
            onClick={onGoHome}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span>Bosh sahifa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
