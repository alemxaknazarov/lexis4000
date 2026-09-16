import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, ArrowRight, RotateCcw, CheckCircle, Sparkles, AlertCircle, FastForward } from 'lucide-react';
import type { Word } from '../../lib/supabase';
import { speakWord, startListening, isSpeechRecognitionSupported, stopAudio } from '../../utils/speech';
import type { SpeechController } from '../../utils/speech';
import { sounds } from '../../utils/soundEffects';

interface Phase4VoiceProps {
  words: Word[];
  onCompletePhase: (earnedXp: number, passedWordIds?: string[]) => void;
}

export const Phase4Voice: React.FC<Phase4VoiceProps> = ({
  words,
  onCompletePhase
}) => {
  const [queue, setQueue] = useState<Word[]>([...words]);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passedWordIds, setPassedWordIds] = useState<Set<string>>(new Set());

  const recognitionRef = useRef<SpeechController | null>(null);
  const isTouchActiveRef = useRef<boolean>(false);

  const currentWord = queue[0];
  const isSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    stopAudio();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setEvaluation('idle');
    setSpokenText(null);
    setErrorMessage(null);

    return () => {
      stopAudio();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [currentWord]);

  const startRecording = () => {
    if (isListening || !currentWord) return;
    stopAudio();
    setErrorMessage(null);
    setSpokenText('');
    setEvaluation('idle');
    setIsListening(true);
    sounds.playClick();

    const controller = startListening(
      currentWord.word,
      (liveText) => {
        setSpokenText(liveText);
      },
      (result) => {
        setSpokenText(result.transcript || '(Ovoz aniqlanmadi)');
        if (result.isCorrect) {
          setEvaluation('correct');
          sounds.playCorrect();
          setPassedWordIds((prev) => new Set(prev).add(currentWord.id));
        } else {
          setEvaluation('wrong');
          sounds.playWrong();
        }
      },
      (err) => {
        setErrorMessage(err);
        setEvaluation('idle');
      },
      () => {
        setIsListening(false);
        recognitionRef.current = null;
      }
    );

    recognitionRef.current = controller;
  };

  const stopRecordingAndEvaluate = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Mobile Touch handlers (Push-to-talk: Hold to record, release to evaluate)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    isTouchActiveRef.current = true;
    if (!isListening) {
      startRecording();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    stopRecordingAndEvaluate();
    setTimeout(() => {
      isTouchActiveRef.current = false;
    }, 400);
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    e.preventDefault();
    stopRecordingAndEvaluate();
    setTimeout(() => {
      isTouchActiveRef.current = false;
    }, 400);
  };

  // Desktop Click handler (Click 1: Start recording, Click 2: Stop & evaluate)
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isTouchActiveRef.current) return;

    if (isListening) {
      stopRecordingAndEvaluate();
    } else {
      startRecording();
    }
  };

  const handleNext = () => {
    stopAudio();
    sounds.playClick();
    const nextQueue = queue.slice(1);
    if (nextQueue.length === 0) {
      onCompletePhase(passedWordIds.size, Array.from(passedWordIds));
    } else {
      setQueue(nextQueue);
      setEvaluation('idle');
      setSpokenText(null);
    }
  };

  const handleRetry = () => {
    stopAudio();
    sounds.playClick();
    setEvaluation('idle');
    setSpokenText(null);
  };

  const handleSkip = () => {
    stopAudio();
    sounds.playClick();
    handleNext();
  };

  if (!currentWord) return null;

  return (
    <div className="py-4 sm:py-8 px-4 max-w-lg mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>4-Bosqich: Ovoz va Talaffuz</span>
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
        {/* Compact thumbnail */}
        <div className="w-20 h-20 rounded-xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
          <img
            src={currentWord.image_url}
            alt={currentWord.word}
            className="w-full h-full object-cover"
          />
        </div>

        {/* English Word & Audio Trigger */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight capitalize">
            {currentWord.word}
          </h2>
          <button
            type="button"
            onClick={() => {
              stopAudio();
              speakWord(currentWord.word, currentWord.audio_url);
            }}
            title="Namunani eshitish"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-6">
          /{currentWord.phonetic}/
        </p>

        {/* Microphone Button (Desktop click-toggle & Mobile press-hold) */}
        <div className="relative mb-3 flex flex-col items-center select-none">
          <button
            type="button"
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            aria-label="Mikrofon"
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer select-none touch-none ${
              isListening
                ? 'bg-emerald-600 text-white ring-8 ring-emerald-500/30 scale-110 animate-pulse'
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 active:scale-95'
            }`}
          >
            <Mic className={`w-8 h-8 sm:w-9 sm:h-9 ${isListening ? 'animate-bounce' : ''}`} />
          </button>
        </div>

        {/* Helper Hint */}
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center">
          {isListening ? (
            <p className="text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
              ● Eshitmoqdaman... Gapirib bo‘lgach bosing yoki qo‘yib yuboring
            </p>
          ) : (
            <div>
              <p className="hidden sm:block font-medium">
                Bosing va gapiring (to‘xtatib tekshirish uchun yana bosing)
              </p>
              <p className="sm:hidden font-medium">
                Bosib turib gapiring, qo‘yib yuborsangiz tekshiradi
              </p>
            </div>
          )}
        </div>

        {/* Live / Evaluated Spoken Text Display */}
        {spokenText !== null && (
          <div
            className={`w-full mb-4 p-3 rounded-xl border text-center transition-all animate-fadeIn ${
              evaluation === 'correct'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80'
                : evaluation === 'wrong'
                ? 'bg-red-50/70 dark:bg-red-950/40 border-red-300 dark:border-red-800/80'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
              {isListening ? 'Eshitilmoqda:' : 'Siz aytdingiz:'}
            </span>
            <span
              className={`text-base sm:text-lg font-bold font-mono ${
                evaluation === 'correct'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : evaluation === 'wrong'
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {spokenText ? `"${spokenText}"` : '(Ovoz kutilmoqda...)'}
            </span>
          </div>
        )}

        {/* Feedback: Correct */}
        {evaluation === 'correct' && (
          <div className="w-full p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>To‘g‘ri aytdingiz!</span>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <span>Keyingisi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Feedback: Wrong */}
        {evaluation === 'wrong' && (
          <div className="w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-shake">
            <div className="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Talaffuz mos kelmadi</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Qayta aytish</span>
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>O‘tkazish</span>
              </button>
            </div>
          </div>
        )}

        {/* Browser Fallback */}
        {(!isSupported || errorMessage) && (
          <div className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2 mt-2">
            <span>{errorMessage || "Mikrofon bu brauzerda cheklangan bo‘lishi mumkin."}</span>
            <button
              type="button"
              onClick={handleNext}
              className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold cursor-pointer"
            >
              O‘tkazish
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
