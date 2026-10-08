import React, { useState, useEffect } from 'react';
import {
  Volume2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Rocket,
  RotateCcw,
  CheckCircle,
  PenTool,
  Target,
  Mic,
  Image as ImageIcon
} from 'lucide-react';
import type { Word } from '../../lib/supabase';
import { speakWord, stopAudio, isAutoSpeakEnabled } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';

interface Phase1FlashcardProps {
  words: Word[];
  onWordIndexChange?: (index: number) => void;
  onFinishPhase: () => void;
}

export const Phase1Flashcard: React.FC<Phase1FlashcardProps> = ({
  words,
  onWordIndexChange,
  onFinishPhase
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCheckScreen, setShowCheckScreen] = useState(false);

  useEffect(() => {
    onWordIndexChange?.(currentIndex);
  }, [currentIndex, onWordIndexChange]);

  const currentWord = words[currentIndex];

  // Stop previous audio and auto-pronounce single word on change
  useEffect(() => {
    stopAudio();
    if (currentWord && !showCheckScreen && isAutoSpeakEnabled()) {
      speakWord(currentWord.word, currentWord.audio_url);
    }
    return () => {
      stopAudio();
    };
  }, [currentIndex, currentWord, showCheckScreen]);

  const handleNext = () => {
    stopAudio();
    sounds.playClick();
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowCheckScreen(true);
    }
  };

  const handlePrev = () => {
    stopAudio();
    sounds.playClick();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const isLastWord = currentIndex === words.length - 1;

  // Dedicated, Stylish "Start Checking" (Sinovni boshlash) Page
  if (showCheckScreen) {
    return (
      <div className="min-h-[calc(100dvh-130px)] px-3.5 sm:px-4 max-w-sm sm:max-w-md mx-auto flex flex-col justify-center items-center my-auto pb-20 sm:pb-6 animate-fadeIn">
        {/* Centered Main Card */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Floating Hero Badge */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 p-0.5 shadow-lg shadow-emerald-500/25 mb-2.5 flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center">
              <Rocket className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Top Stage Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-bosqich yakunlandi</span>
          </div>

          {/* Headline & Description */}
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            Sinovga tayyormisiz? 🎯
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5 max-w-xs leading-relaxed">
            Barcha <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{words.length} ta so‘z</strong> ko‘rib chiqildi. Endi mustahkamlash uchun 4 ta tezkor sinovdan o‘tasiz:
          </p>

          {/* 4 Test Stages (Clean 2x2 cards with distinct tints) */}
          <div className="grid grid-cols-2 gap-2 w-full text-left">
            <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <PenTool className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">1. Yozish</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Harflab yozish</p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Target className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">2. Ma’no</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Variantli test</p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-purple-500/15 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Mic className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">3. Talaffuz</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Ovozda aytish</p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ImageIcon className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">4. Rasm</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Rasmni topish</p>
              </div>
            </div>
          </div>
        </div>

        {/* Docked Bottom Bar: Elevated higher with generous safe-area padding */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-4 pt-3 pb-[max(1.75rem,calc(env(safe-area-inset-bottom)+1rem))] shadow-lg">
          <div className="max-w-sm sm:max-w-md mx-auto flex items-center gap-2.5 w-full">
            {/* 30% Takrorlash Button */}
            <button
              type="button"
              onClick={() => {
                setShowCheckScreen(false);
                setCurrentIndex(0);
              }}
              className="w-[32%] sm:w-[30%] h-10 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 min-w-0"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Takrorlash</span>
            </button>

            {/* 70% Sinovni Boshlash Button */}
            <button
              type="button"
              onClick={onFinishPhase}
              className="flex-1 h-10 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-w-0"
            >
              <span className="truncate">Sinovni boshlash</span>
              <Rocket className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentWord) return null;

  return (
    <>
      {/* Attached Top Indicator Bar (Seamlessly merged with Navbar in navbar color) */}
      <div className="fixed top-[calc(3.5rem+env(safe-area-inset-top,0px))] left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2 transition-colors">
        <div className="max-w-sm sm:max-w-md mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>So‘zni eshiting va yodlang</span>
            </span>
            <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
              {currentIndex + 1} / {words.length}
            </span>
          </div>

          {/* Thin Progress Line */}
          <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-200"
              style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Flashcard Container (Vertically centered in the remaining viewport space) */}
      <div className="min-h-[calc(100dvh-130px)] pt-12 sm:pt-14 px-3 sm:px-4 max-w-sm sm:max-w-md mx-auto flex flex-col justify-center items-center my-auto pb-28 sm:pb-8">
        {/* Minimalist, Scroll-Free Flashcard Card */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col items-center text-center transition-colors">
          {/* Compact Word Illustration */}
          <div className="w-full h-32 sm:h-44 rounded-xl overflow-hidden mb-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 relative shrink-0">
            <img
              src={currentWord.image_url}
              alt={currentWord.word}
              className="w-full h-full object-cover"
            />
            {currentWord.part_of_speech && (
              <div className="absolute top-2 right-2">
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {currentWord.part_of_speech}
                </span>
              </div>
            )}
          </div>

          {/* English Word & Audio Button */}
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight capitalize">
              {currentWord.word}
            </h2>
            <button
              onClick={() => {
                stopAudio();
                speakWord(currentWord.word, currentWord.audio_url);
              }}
              title="So‘z talaffuzini eshitish"
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Phonetics */}
          <p className="text-[11px] sm:text-xs font-mono text-slate-400 dark:text-slate-500 mb-2">
            /{currentWord.phonetic}/
          </p>

          {/* Uzbek Translation */}
          <div className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
              Tarjimasi:
            </span>
            <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {currentWord.translation_uz}
            </p>
          </div>
        </div>

        {/* Docked Bottom Learning Bar (Elevated higher with generous safe-area padding) */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-4 pt-3 pb-[max(1.75rem,calc(env(safe-area-inset-bottom)+1rem))] shadow-lg">
          <div className="max-w-sm sm:max-w-md mx-auto flex items-center justify-between gap-2.5 w-full">
            {/* Oldingi Button */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`flex-1 h-10 px-2 sm:px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 min-w-0 ${
                currentIndex === 0
                  ? 'opacity-30 cursor-not-allowed text-slate-400 border border-slate-200/40 dark:border-slate-800/40'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Oldingi</span>
            </button>

            {/* Word Counter in the Center */}
            <div className="shrink-0 h-10 px-2.5 sm:px-3 flex items-center justify-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 text-xs font-semibold select-none">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {currentIndex + 1}
              </span>
              <span className="text-slate-400 font-normal">/</span>
              <span className="text-slate-600 dark:text-slate-300 font-mono">
                {words.length}
              </span>
              <span className="text-[10px] text-slate-400 font-medium ml-0.5 hidden xs:inline">
                so‘z
              </span>
            </div>

            {/* Keyingi / Tugatish Button */}
            {isLastWord ? (
              <button
                type="button"
                onClick={() => setShowCheckScreen(true)}
                className="flex-1 h-10 px-2 sm:px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 min-w-0"
              >
                <span className="truncate">Tugatish</span>
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 h-10 px-2 sm:px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-semibold shadow-xs active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 min-w-0"
              >
                <span className="truncate">Keyingi</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
