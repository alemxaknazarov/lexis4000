import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ArrowRight, Home, CheckCircle2, Sparkles, Zap, BookOpen } from 'lucide-react';
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

    // Celebration confetti
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.65 }
    });
  }, []);

  const maxPossibleXp = words.length;
  const xpEarned = earnedXp ?? maxPossibleXp;
  const sessionScore = sessionAccuracy ?? (maxPossibleXp > 0 ? Math.round((xpEarned / maxPossibleXp) * 100) : 100);
  const unitScore = unitAccuracy ?? 0;
  const isFullyFinished = isUnitCompleted ?? (unitScore >= 100);
  const learnedCount = unitLearnedCount ?? words.length;

  return (
    <div className="py-6 sm:py-10 px-4 max-w-xl mx-auto flex flex-col items-center text-center animate-fadeIn">
      {/* Transparent Glassmorphic Main Card */}
      <div className="w-full bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Ambient background glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/15 dark:bg-emerald-500/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 right-0 w-60 h-60 bg-teal-500/10 dark:bg-teal-500/8 rounded-full blur-2xl pointer-events-none" />

        {/* Celebratory Glowing Trophy Badge */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 flex items-center justify-center mb-4 transform hover:scale-105 transition-transform">
          <div className="w-full h-full rounded-[22px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center">
            <Trophy className="w-9 h-9 sm:w-11 sm:h-11 text-amber-500 dark:text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Unit & Book Indicator Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/90 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            {isFullyFinished
              ? `Book ${bookNumber} • Unit ${unitNumber} To‘liq Bajarildi! 🏆`
              : `Book ${bookNumber} • Unit ${unitNumber} (${unitScore}%)`}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          {isFullyFinished
            ? 'Unit Muvaffaqiyatli Yakunlandi! 🎉'
            : 'Sinov Muvaffaqiyatli Tugatildi! ✨'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md leading-relaxed">
          {isFullyFinished
            ? `Ajoyib natija! Siz ushbu unitdagi barcha 20 ta so‘zni 5 ta bosqichdan to‘liq o‘zlashtirdingiz.`
            : `Siz ${words.length} ta so‘zni barcha bosqichlardan mukammal o‘tkazdingiz. Unit umumiy o‘zlashtirilishi: ${unitScore}%.`}
        </p>

        {/* Frosted Glass Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full mb-5">
          {/* Metric 1: Accuracy */}
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-md flex flex-col items-center shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Aniqlik
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {sessionScore}%
            </span>
          </div>

          {/* Metric 2: Earned XP */}
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-md flex flex-col items-center shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Tajriba</span>
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              +{xpEarned} XP
            </span>
          </div>

          {/* Metric 3: Unit Progress */}
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-md flex flex-col items-center shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-blue-500" />
              <span>Unit</span>
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
              {learnedCount}/20
            </span>
          </div>
        </div>

        {/* Unit Overall Progress Bar */}
        <div className="w-full bg-slate-100/80 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-xs mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            <span>Unit o‘zlashtirish ko‘rsatkichi</span>
            <span className="text-emerald-600 dark:text-emerald-400">{unitScore}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, unitScore))}%` }}
            />
          </div>
        </div>

        {/* Frosted List of Perfected Words */}
        <div className="w-full bg-white/50 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-4 mb-6 text-left backdrop-blur-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Mukammal o‘zlashtirilgan so‘zlar ({words.length} ta):</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {words.map((w) => (
              <span
                key={w.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/70 text-xs text-slate-800 dark:text-slate-200 backdrop-blur-xs shadow-2xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <strong className="capitalize">{w.word}</strong>
                <span className="text-slate-400 dark:text-slate-500 text-[10px]">• {w.translation_uz}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Primary Action Button */}
          {!isFullyFinished && onContinueUnit ? (
            <button
              type="button"
              onClick={onContinueUnit}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>Qolgan so‘zlarni o‘rganish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onNextUnit}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>Keyingi Unitga o‘tish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Secondary Actions: 2 Frosted Glass Columns */}
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button
              type="button"
              onClick={onRestart}
              className="py-2.5 px-4 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold backdrop-blur-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Qayta takrorlash</span>
            </button>

            <button
              type="button"
              onClick={onGoHome}
              className="py-2.5 px-4 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold backdrop-blur-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] shadow-2xs"
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span>Bosh sahifa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
