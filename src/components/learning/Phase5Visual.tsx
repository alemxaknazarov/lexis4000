import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import type { Word } from '../../lib/supabase';
import { speakWord, stopAudio } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';
import { recordMistake } from '../../utils/mistakeManager';

interface Phase5VisualProps {
  words: Word[];
  allWords: Word[];
  onCompletePhase: (earnedXp: number, passedWordIds?: string[], failedWordIds?: string[]) => void;
}

export const Phase5Visual: React.FC<Phase5VisualProps> = ({
  words,
  allWords,
  onCompletePhase
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageOptions, setImageOptions] = useState<Word[]>([]);
  const [isImagesLoading, setIsImagesLoading] = useState(true);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [wrongImageIds, setWrongImageIds] = useState<Set<string>>(new Set());
  const [failedWordIds, setFailedWordIds] = useState<Set<string>>(new Set());
  const [secondChanceActive, setSecondChanceActive] = useState(false);
  const [showFailureAlert, setShowFailureAlert] = useState(false);

  const currentWord = words[currentIndex];

  useEffect(() => {
    stopAudio();
    if (!currentWord) return;

    setIsImagesLoading(true);
    setSelectedWordId(null);
    setIsAnswering(false);
    setWrongImageIds(new Set());
    setSecondChanceActive(false);
    setShowFailureAlert(false);

    const pool = allWords.filter((w) => w.id !== currentWord.id);
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    const distractors = shuffledPool.slice(0, 3);

    const fullOptions = [currentWord, ...distractors].sort(() => 0.5 - Math.random());
    setImageOptions(fullOptions);

    let isMounted = true;

    // Preload all 4 images simultaneously before displaying any of them
    const preloadPromises = fullOptions.map((opt) => {
      return new Promise<void>((resolve) => {
        if (!opt.image_url) {
          resolve();
          return;
        }
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = opt.image_url;
        if (img.complete) {
          resolve();
        }
      });
    });

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(resolve, 1200); // 1.2s max fallback in case of slow network
    });

    Promise.race([Promise.all(preloadPromises), timeoutPromise]).then(() => {
      if (isMounted) {
        setIsImagesLoading(false);
      }
    });

    // Proactively preload the next word's image in background for instant transition
    const nextWord = words[currentIndex + 1];
    if (nextWord?.image_url) {
      const nextImg = new Image();
      nextImg.src = nextWord.image_url;
    }

    return () => {
      isMounted = false;
      stopAudio();
    };
  }, [currentIndex, words, allWords]);

  const handleSelectImage = (optionWord: Word) => {
    if (isAnswering || isImagesLoading || !currentWord || wrongImageIds.has(optionWord.id)) return;

    setSelectedWordId(optionWord.id);
    const isCorrect = optionWord.id === currentWord.id;

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
      const updatedWrong = new Set(wrongImageIds).add(optionWord.id);
      setWrongImageIds(updatedWrong);

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
          <span>5-Bosqich: Rasmni topish</span>
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

        {/* 2nd Chance Alert */}
        {secondChanceActive && !showFailureAlert && (
          <div className="mt-3 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1.5 animate-fadeIn">
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              Noto‘g‘ri rasm! <strong>2-imkoniyat</strong> berildi — to‘g‘ri rasmni tanlang.
            </span>
          </div>
        )}

        {/* 2 Mistakes Failure Alert */}
        {showFailureAlert && (
          <div className="mt-3 p-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-700 dark:text-red-300 flex items-center justify-center gap-1.5 animate-fadeIn">
            <RotateCcw className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>
              2 marta xato qilindi! Xatolar ro‘yxatiga qo‘shildi.
            </span>
          </div>
        )}
      </div>

      {/* 2x2 Grid of 4 Images: Synchronized Loading Skeleton or Fully Loaded Images */}
      {isImagesLoading ? (
        <div className="grid grid-cols-2 gap-3 w-full">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-36 sm:h-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 animate-pulse flex items-center justify-center relative overflow-hidden"
            >
              <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-emerald-500 animate-spin opacity-50" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 w-full animate-fadeIn">
          {imageOptions.map((opt) => {
            const isSelected = selectedWordId === opt.id;
            const isCorrect = opt.id === currentWord.id;
            const isWrong = wrongImageIds.has(opt.id);

            let cardStyle = 'border-slate-200 dark:border-slate-800 hover:border-emerald-500';

            if (isWrong) {
              cardStyle = 'border-red-500 ring-2 ring-red-500/40 opacity-50 cursor-not-allowed';
            } else if (isAnswering) {
              if (isCorrect) {
                cardStyle = 'border-emerald-500 ring-2 ring-emerald-500/50';
              } else if (isSelected && !isCorrect) {
                cardStyle = 'border-red-500 ring-2 ring-red-500/50';
              } else {
                cardStyle = 'border-slate-200 dark:border-slate-800 opacity-40 cursor-not-allowed';
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
                  alt=""
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />

                {/* Status Overlays */}
                {isAnswering && isCorrect && (
                  <div className="absolute inset-0 bg-emerald-950/40 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                )}

                {isWrong && (
                  <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
