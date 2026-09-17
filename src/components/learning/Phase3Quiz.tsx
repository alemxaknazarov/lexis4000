import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import type { Word } from '../../lib/supabase';
import { speakWord, stopAudio } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';
import { recordMistake } from '../../utils/mistakeManager';

interface Phase3QuizProps {
  words: Word[];
  allWords: Word[];
  onCompletePhase: (earnedXp: number, passedWordIds?: string[], failedWordIds?: string[]) => void;
}

export const Phase3Quiz: React.FC<Phase3QuizProps> = ({
  words,
  allWords,
  onCompletePhase
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [wrongOptions, setWrongOptions] = useState<Set<string>>(new Set());
  const [failedWordIds, setFailedWordIds] = useState<Set<string>>(new Set());
  const [secondChanceActive, setSecondChanceActive] = useState(false);
  const [showFailureAlert, setShowFailureAlert] = useState(false);

  const currentWord = words[currentIndex];

  useEffect(() => {
    stopAudio();
    if (!currentWord) return;

    setSelectedOption(null);
    setIsAnswering(false);
    setWrongOptions(new Set());
    setSecondChanceActive(false);
    setShowFailureAlert(false);

    const pool = allWords.filter(
      (w) => w.id !== currentWord.id && w.translation_uz !== currentWord.translation_uz
    );
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    const distractors = shuffledPool.slice(0, 3).map((w) => w.translation_uz);

    const fullOptions = [currentWord.translation_uz, ...distractors].sort(
      () => 0.5 - Math.random()
    );
    setOptions(fullOptions);

    return () => {
      stopAudio();
    };
  }, [currentIndex, words, allWords]);

  const handleSelectOption = (opt: string) => {
    if (isAnswering || !currentWord || wrongOptions.has(opt)) return;

    setSelectedOption(opt);
    const isCorrect = opt === currentWord.translation_uz;

    if (isCorrect) {
      setIsAnswering(true);
      sounds.playCorrect();

      setTimeout(() => {
        if (currentIndex + 1 < words.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          const passed = words.filter((w) => !failedWordIds.has(w.id));
          onCompletePhase(passed.length, passed.map((w) => w.id), Array.from(failedWordIds));
        }
      }, 700);
    } else {
      sounds.playWrong();
      const updatedWrong = new Set(wrongOptions).add(opt);
      setWrongOptions(updatedWrong);

      if (updatedWrong.size === 1) {
        // 1-xato: 2-imkoniyat beriladi!
        setSecondChanceActive(true);
      } else {
        // 2-xato: Rasman xato deb hisoblanadi va xatolar ro'yxatiga qo'shiladi
        setIsAnswering(true);
        setShowFailureAlert(true);
        recordMistake(currentWord);
        const updatedFailed = new Set(failedWordIds).add(currentWord.id);
        setFailedWordIds(updatedFailed);

        setTimeout(() => {
          if (currentIndex + 1 < words.length) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            const passed = words.filter((w) => !updatedFailed.has(w.id));
            onCompletePhase(passed.length, passed.map((w) => w.id), Array.from(updatedFailed));
          }
        }, 1800);
      }
    }
  };

  if (!currentWord) return null;

  return (
    <div className="py-4 sm:py-8 px-4 max-w-lg mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>3-Bosqich: To‘g‘ri ma’noni topish</span>
        </span>
        <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
          {currentIndex + 1} / {words.length} (Qoldi: {words.length - currentIndex} ta)
        </span>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-200"
          style={{ width: `${Math.max(5, ((currentIndex + 1) / words.length) * 100)}%` }}
        />
      </div>

      {/* Main Card */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center transition-colors">
        {/* Part of Speech Badge */}
        {currentWord.part_of_speech && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 mb-3">
            {currentWord.part_of_speech}
          </span>
        )}

        {/* Sub-prompt */}
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
          So‘zning to‘g‘ri ma’nosini toping:
        </span>

        {/* English Word & Audio Trigger */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight capitalize">
            {currentWord.word}
          </h2>
          <button
            type="button"
            onClick={() => {
              stopAudio();
              speakWord(currentWord.word, currentWord.audio_url);
            }}
            title="Talaffuzni eshitish"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {currentWord.phonetic && (
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-5">
            /{currentWord.phonetic}/
          </p>
        )}

        {/* 2nd Chance Alert */}
        {secondChanceActive && !showFailureAlert && (
          <div className="w-full mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2 animate-fadeIn">
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              Noto‘g‘ri! <strong>2-imkoniyat</strong> berildi — qolgan variantlardan tanlang.
            </span>
          </div>
        )}

        {/* 2 Mistakes Failure Alert */}
        {showFailureAlert && (
          <div className="w-full mb-4 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-700 dark:text-red-300 flex items-center justify-center gap-2 animate-fadeIn">
            <RotateCcw className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>
              2 marta xato qilindi! Xatolar ro‘yxatiga qo‘shildi. To‘g‘ri javob: <strong>{currentWord.translation_uz}</strong>
            </span>
          </div>
        )}

        {/* 4 Translation Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
          {options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentWord.translation_uz;
            const isWrong = wrongOptions.has(option);

            let btnStyle = 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 text-slate-800 dark:text-slate-200';

            if (isWrong) {
              btnStyle = 'bg-red-50 dark:bg-red-950/80 border-red-400 text-red-700 dark:text-red-300 opacity-60 cursor-not-allowed';
            } else if (isAnswering) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500';
              } else if (isSelected && !isCorrect) {
                btnStyle = 'bg-red-50 dark:bg-red-950/80 border-red-500 text-red-700 dark:text-red-300';
              } else {
                btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswering || isWrong}
                onClick={() => handleSelectOption(option)}
                className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center justify-between text-left cursor-pointer ${btnStyle}`}
              >
                <span>{option}</span>
                {isAnswering && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {isWrong && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
