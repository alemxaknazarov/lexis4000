import React, { useState, useEffect } from 'react';
import { Volume2, ArrowLeft, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import type { Word } from '../../lib/supabase';
import { speakWord, stopAudio } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';

interface Phase1FlashcardProps {
  words: Word[];
  onFinishPhase: () => void;
}

export const Phase1Flashcard: React.FC<Phase1FlashcardProps> = ({
  words,
  onFinishPhase
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFinishModal, setShowFinishModal] = useState(false);

  const currentWord = words[currentIndex];

  // Stop previous audio and auto-pronounce single word on change
  useEffect(() => {
    stopAudio();
    if (currentWord) {
      speakWord(currentWord.word, currentWord.audio_url);
    }
    return () => {
      stopAudio();
    };
  }, [currentIndex, currentWord]);

  const handleNext = () => {
    stopAudio();
    sounds.playClick();
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowFinishModal(true);
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

  if (!currentWord) return null;

  return (
    <div className="py-4 sm:py-8 px-4 max-w-lg mx-auto flex flex-col items-center">
      {/* Top compact indicator */}
      <div className="w-full flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>1-Bosqich: So‘z yodlash</span>
        </span>
        <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
          {currentIndex + 1} / {words.length}
        </span>
      </div>

      {/* Subtle Progress Line */}
      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-200"
          style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
        />
      </div>

      {/* Minimalist Flashcard Card */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col items-center text-center transition-colors">
        {/* Compact Word Illustration */}
        <div className="w-full h-44 sm:h-52 rounded-xl overflow-hidden mb-5 bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 relative">
          <img
            src={currentWord.image_url}
            alt={currentWord.word}
            className="w-full h-full object-cover"
          />
          {currentWord.part_of_speech && (
            <div className="absolute top-2.5 right-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
                {currentWord.part_of_speech}
              </span>
            </div>
          )}
        </div>

        {/* English Word & Audio Button */}
        <div className="flex items-center justify-center gap-2.5 mb-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight capitalize">
            {currentWord.word}
          </h2>
          <button
            onClick={() => {
              stopAudio();
              speakWord(currentWord.word, currentWord.audio_url);
            }}
            title="So‘z talaffuzini eshitish"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Phonetics */}
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-4">
          /{currentWord.phonetic}/
        </p>

        {/* Directly visible Uzbek Translation (Clear & Minimal) */}
        <div className="w-full py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 mb-6">
          <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
            O‘zbekcha tarjimasi:
          </span>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {currentWord.translation_uz}
          </p>
        </div>

        {/* Navigation Buttons: Prev / Next / Finish */}
        <div className="flex items-center justify-between w-full pt-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              currentIndex === 0
                ? 'opacity-30 cursor-not-allowed text-slate-400'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Oldingi</span>
          </button>

          {isLastWord ? (
            <button
              onClick={() => setShowFinishModal(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Finish (Tugatish)</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <span>Keyingi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Start Checking Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">
              1-Bosqich Yakunlandi!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Barcha so‘zlarni ko‘rib chiqdingiz. Endi 2-bosqich: so‘zlarni <strong className="text-slate-800 dark:text-slate-200 font-semibold">harflab yozish (Spelling)</strong> sinovini boshlaymiz.
            </p>

            <button
              onClick={onFinishPhase}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              Start Checking 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
