import React, { useState, useEffect, useRef } from 'react';
import { Check, RotateCcw, Sparkles } from 'lucide-react';
import type { Word } from '../../lib/supabase';
import { sounds } from '../../utils/soundEffects';
import { stopAudio } from '../../utils/speech';

interface Phase2SpellingProps {
  words: Word[];
  onCompletePhase: (earnedXp: number, passedWordIds?: string[]) => void;
}

export const Phase2Spelling: React.FC<Phase2SpellingProps> = ({
  words,
  onCompletePhase
}) => {
  const [queue, setQueue] = useState<Word[]>([...words]);
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<'typing' | 'correct' | 'wrong'>('typing');
  const [showAnswer, setShowAnswer] = useState(false);
  const [mistakeWordIds, setMistakeWordIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = queue[0];
  const targetClean = currentWord ? currentWord.word.trim().toLowerCase() : '';
  const letterCount = targetClean.length;

  useEffect(() => {
    stopAudio();
    setUserInput('');
    setStatus('typing');
    setShowAnswer(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentWord]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status !== 'typing') return;
    const val = e.target.value.toLowerCase().slice(0, letterCount);
    setUserInput(val);
  };

  const handleCheck = () => {
    if (status !== 'typing' || !currentWord) return;

    if (userInput.trim().toLowerCase() === targetClean) {
      setStatus('correct');
      sounds.playCorrect();

      setTimeout(() => {
        const nextQueue = queue.slice(1);
        if (nextQueue.length === 0) {
          const passed = words.filter((w) => !mistakeWordIds.has(w.id));
          onCompletePhase(passed.length, passed.map((w) => w.id));
        } else {
          setQueue(nextQueue);
        }
      }, 700);
    } else {
      setStatus('wrong');
      setShowAnswer(true);
      sounds.playWrong();
      setMistakeWordIds((prev) => new Set(prev).add(currentWord.id));

      setTimeout(() => {
        const wrongWord = currentWord;
        const reordered = [...queue.slice(1), wrongWord];
        setQueue(reordered);
        setUserInput('');
        setStatus('typing');
        setShowAnswer(false);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 1800);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCheck();
    }
  };

  if (!currentWord) return null;

  return (
    <div className="py-4 sm:py-8 px-4 max-w-lg mx-auto flex flex-col items-center">
      {/* Step Header */}
      <div className="w-full flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>2-Bosqich: So‘zni yozish</span>
        </span>
        <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
          Qoldi: {queue.length} ta
        </span>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-200"
          style={{ width: `${Math.max(5, ((words.length - queue.length) / words.length) * 100)}%` }}
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

        {/* Uzbek Meaning */}
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
          O‘zbekcha tarjimasi:
        </span>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-5">
          {currentWord.translation_uz}
        </h3>

        {/* Letter Boxes Container with focused input */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="relative w-full flex flex-col items-center justify-center mb-5 cursor-text"
        >
          {/* Real input positioned strictly inside the letter boxes area */}
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            className="absolute inset-0 opacity-0 w-full h-full cursor-text z-10"
            aria-label="So‘zni yozing"
          />

          {/* Letter Boxes */}
          <div
            className={`flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 ${
              status === 'wrong' ? 'animate-shake' : ''
            }`}
          >
            {Array.from({ length: letterCount }).map((_, idx) => {
              const char = userInput[idx] || '';
              const isCurrent = idx === userInput.length;

              let boxStyle = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white';
              if (status === 'correct') {
                boxStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400';
              } else if (status === 'wrong') {
                boxStyle = 'border-red-500 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400';
              } else if (isCurrent) {
                boxStyle = 'border-emerald-600 dark:border-emerald-400 bg-white dark:bg-slate-900 ring-2 ring-emerald-500/20';
              }

              return (
                <div
                  key={idx}
                  className={`w-9 h-11 sm:w-11 sm:h-13 rounded-lg border font-mono font-bold text-lg sm:text-xl flex items-center justify-center uppercase transition-colors ${boxStyle}`}
                >
                  {char}
                </div>
              );
            })}
          </div>
        </div>

        {/* Wrong Feedback Hint */}
        {showAnswer && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-700 dark:text-red-300 flex items-center justify-center gap-2 animate-fadeIn">
            <RotateCcw className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>
              To‘g‘ri yozilishi: <strong className="font-mono uppercase">{currentWord.word}</strong> (So‘z navbat oxiriga o‘tdi)
            </span>
          </div>
        )}

        {/* Action Check Button */}
        <div className="relative z-20 w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Katakchalarga bosing va yozing
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCheck();
            }}
            disabled={userInput.length === 0 || status !== 'typing'}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer relative z-30 ${
              userInput.length > 0 && status === 'typing'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Tekshirish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
