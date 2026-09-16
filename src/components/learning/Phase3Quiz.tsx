import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import type { Word } from '../../lib/supabase';
import { speakWord, stopAudio } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';
import { recordMistake, removeMistake } from '../../utils/mistakeManager';

interface Phase3QuizProps {
  words: Word[];
  allWords: Word[];
  onCompletePhase: (earnedXp: number, passedWordIds?: string[]) => void;
}

export const Phase3Quiz: React.FC<Phase3QuizProps> = ({
  words,
  allWords,
  onCompletePhase
}) => {
  const [round, setRound] = useState<1 | 2>(1);
  const [activeList, setActiveList] = useState<Word[]>([...words]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [missedWords, setMissedWords] = useState<Word[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  const currentWord = activeList[currentIndex];

  useEffect(() => {
    stopAudio();
    if (!currentWord) return;

    setSelectedOption(null);
    setIsAnswering(false);

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
  }, [currentIndex, round, activeList]);

  const handleSelectOption = (opt: string) => {
    if (isAnswering || !currentWord) return;
    setIsAnswering(true);
    setSelectedOption(opt);

    const isCorrect = opt === currentWord.translation_uz;

    let updatedMissed = missedWords;
    if (isCorrect) {
      sounds.playCorrect();
      if (round === 1) {
        removeMistake(currentWord.id);
      }
    } else {
      sounds.playWrong();
      recordMistake(currentWord);
      if (round === 1) {
        if (!missedWords.some((w) => w.id === currentWord.id)) {
          updatedMissed = [...missedWords, currentWord];
          setMissedWords(updatedMissed);
        }
      }
    }

    const delay = isCorrect ? 600 : 1200;

    setTimeout(() => {
      if (currentIndex + 1 < activeList.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswering(false);
      } else {
        // End of activeList
        if (round === 1) {
          if (updatedMissed.length > 0) {
            // Give ONE second chance for missed words
            setRound(2);
            setActiveList(updatedMissed);
            setCurrentIndex(0);
            setSelectedOption(null);
            setIsAnswering(false);
          } else {
            const passed = words.filter((w) => !updatedMissed.some((m) => m.id === w.id));
            onCompletePhase(passed.length, passed.map((w) => w.id));
          }
        } else {
          // Round 2 completed, whether correct or wrong, finish phase
          const passed = words.filter((w) => !updatedMissed.some((m) => m.id === w.id));
          onCompletePhase(passed.length, passed.map((w) => w.id));
        }
      }
    }, delay);
  };

  if (!currentWord) return null;

  return (
    <div className="py-4 sm:py-8 px-4 max-w-lg mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>
            {round === 1 ? '3-Bosqich: To‘g‘ri ma’noni topish' : 'Ikkinchi imkoniyat (Qayta sinov)'}
          </span>
        </span>
        <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
          {currentIndex + 1} / {activeList.length} (Qoldi: {activeList.length - currentIndex} ta)
        </span>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
        <div
          className={`h-full transition-all duration-200 ${
            round === 1 ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-amber-500 dark:bg-amber-400'
          }`}
          style={{ width: `${Math.max(5, ((currentIndex + 1) / activeList.length) * 100)}%` }}
        />
      </div>

      {/* Main Card */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col items-center text-center transition-colors">
        {/* Compact Illustration */}
        <div className="w-full h-40 sm:h-48 rounded-xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
          <img
            src={currentWord.image_url}
            alt={currentWord.word}
            className="w-full h-full object-cover"
          />
        </div>

        {/* English Word & Audio Trigger */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight capitalize">
            {currentWord.word}
          </h2>
          <button
            onClick={() => {
              stopAudio();
              speakWord(currentWord.word, currentWord.audio_url);
            }}
            title="Eshitish"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Translation Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
          {options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentWord.translation_uz;

            let btnStyle = 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 text-slate-800 dark:text-slate-200';

            if (isAnswering) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500';
              } else if (isSelected && !isCorrect) {
                btnStyle = 'bg-red-50 dark:bg-red-950/80 border-red-500 text-red-700 dark:text-red-300 animate-shake';
              } else {
                btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800 text-slate-400';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswering}
                onClick={() => handleSelectOption(option)}
                className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center justify-between text-left cursor-pointer ${btnStyle}`}
              >
                <span>{option}</span>
                {isAnswering && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {isAnswering && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
