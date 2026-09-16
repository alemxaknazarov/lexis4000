import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import type { Word } from '../../lib/supabase';
import { speakWord, stopAudio } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';
import { recordMistake, removeMistake } from '../../utils/mistakeManager';

interface Phase5VisualProps {
  words: Word[];
  allWords: Word[];
  onCompletePhase: (earnedXp: number, passedWordIds?: string[]) => void;
}

export const Phase5Visual: React.FC<Phase5VisualProps> = ({
  words,
  allWords,
  onCompletePhase
}) => {
  const [round, setRound] = useState<1 | 2>(1);
  const [activeList, setActiveList] = useState<Word[]>([...words]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [missedWords, setMissedWords] = useState<Word[]>([]);
  const [imageOptions, setImageOptions] = useState<Word[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  const currentWord = activeList[currentIndex];

  useEffect(() => {
    stopAudio();
    if (!currentWord) return;

    setSelectedWordId(null);
    setIsAnswering(false);

    const pool = allWords.filter((w) => w.id !== currentWord.id);
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    const distractors = shuffledPool.slice(0, 3);

    const fullOptions = [currentWord, ...distractors].sort(() => 0.5 - Math.random());
    setImageOptions(fullOptions);

    return () => {
      stopAudio();
    };
  }, [currentIndex, round, activeList]);

  const handleSelectImage = (optionWord: Word) => {
    if (isAnswering || !currentWord) return;
    setIsAnswering(true);
    setSelectedWordId(optionWord.id);

    const isCorrect = optionWord.id === currentWord.id;

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
        setSelectedWordId(null);
        setIsAnswering(false);
      } else {
        // End of activeList
        if (round === 1) {
          if (updatedMissed.length > 0) {
            // Give ONE second chance for missed words (Round 2)
            setRound(2);
            setActiveList(updatedMissed);
            setCurrentIndex(0);
            setSelectedWordId(null);
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
            {round === 1 ? '5-Bosqich: Rasmni topish' : 'Ikkinchi imkoniyat (Qayta sinov)'}
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

      {/* Target Word Display */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col items-center text-center mb-4 transition-colors">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
          So‘zga mos to‘g‘ri rasmni tanlang:
        </span>

        <div className="flex items-center justify-center gap-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight capitalize">
            {currentWord.word}
          </h2>
          <button
            type="button"
            onClick={() => {
              stopAudio();
              speakWord(currentWord.word, currentWord.audio_url);
            }}
            title="Eshitish"
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
          /{currentWord.phonetic}/
        </p>
      </div>

      {/* 2x2 Grid of 4 Images */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {imageOptions.map((opt) => {
          const isSelected = selectedWordId === opt.id;
          const isCorrect = opt.id === currentWord.id;

          let cardStyle = 'border-slate-200 dark:border-slate-800 hover:border-emerald-500';

          if (isAnswering) {
            if (isCorrect) {
              cardStyle = 'border-emerald-500 ring-2 ring-emerald-500/40';
            } else if (isSelected && !isCorrect) {
              cardStyle = 'border-red-500 ring-2 ring-red-500/40 animate-shake opacity-60';
            } else {
              cardStyle = 'border-slate-200 dark:border-slate-800 opacity-40';
            }
          }

          return (
            <div
              key={opt.id}
              onClick={() => handleSelectImage(opt)}
              className={`relative h-36 sm:h-44 rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-950 cursor-pointer transition-all duration-150 ${cardStyle}`}
            >
              <img
                src={opt.image_url}
                alt={opt.word}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Status Overlays */}
              {isAnswering && isCorrect && (
                <div className="absolute inset-0 bg-emerald-950/40 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
              )}

              {isAnswering && isSelected && !isCorrect && (
                <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
