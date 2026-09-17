import React, { useState, useEffect } from 'react';
import {
  Volume2,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Rocket,
  PenTool,
  Target,
  Mic,
  Image as ImageIcon,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import type { Word } from '../../lib/supabase';
import { speakWord, stopAudio, isAutoSpeakEnabled } from '../../utils/speech';
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
  const [showFinishScreen, setShowFinishScreen] = useState(false);

  const currentWord = words[currentIndex];

  // Stop previous audio and auto-pronounce single word on change
  useEffect(() => {
    stopAudio();
    if (currentWord && !showFinishScreen && isAutoSpeakEnabled()) {
      speakWord(currentWord.word, currentWord.audio_url);
    }
    return () => {
      stopAudio();
    };
  }, [currentIndex, currentWord, showFinishScreen]);

  const handleNext = () => {
    stopAudio();
    sounds.playClick();
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowFinishScreen(true);
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

  // Dedicated Full-Page "Start Checking" View (under Navbar)
  if (showFinishScreen) {
    return (
      <div className="py-6 sm:py-10 px-4 max-w-2xl mx-auto flex flex-col items-center animate-fadeIn">
        {/* Transparent Glassmorphic Hero Container */}
        <div className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
          {/* Subtle glowing background aura */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Bosqich Muvaffaqiyatli Yakunlandi</span>
          </div>

          {/* Rocket Hero Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4 transform hover:scale-105 transition-transform">
            <Rocket className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          {/* Title & Description */}
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Sinov Bosqichlariga Tayyormisiz?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            Siz <strong>{words.length} ta so‘z</strong> bilan tanishib chiqdingiz. Endi bilimlaringizni mustahkamlash uchun <strong>4 ta sinov bosqichi</strong> boshlanadi:
          </p>

          {/* 4 Checking Stages Showcase Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-6 text-left">
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-xs flex items-start gap-3 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">2. Eshitib Yozish</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Talaffuzni tinglab, so‘zni to‘g‘ri harflab yozasiz.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-xs flex items-start gap-3 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">3. To‘g‘ri Ma’no</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Inglizcha so‘zga mos to‘g‘ri tarjimani topasiz.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-xs flex items-start gap-3 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">4. Ovozli Talaffuz</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">So‘zni mikrofonga toza va aniq talaffuz qilasiz.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-xs flex items-start gap-3 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">5. Rasmni Topish</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">So‘zga mos to‘g‘ri illyustratsiyani tanlaysiz.</p>
              </div>
            </div>
          </div>

          {/* Rule Note */}
          <div className="w-full p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-left flex items-center gap-2.5 mb-6 text-xs text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Qoida:</strong> Har bir so‘z 4 ta sinovdan to‘liq va xatosiz o‘tsagina <strong>1 XP</strong> beriladi va unit <strong>5%</strong> ga bajariladi.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                setShowFinishScreen(false);
                setCurrentIndex(0);
              }}
              className="w-full sm:w-1/3 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Qayta ko‘rish</span>
            </button>

            <button
              type="button"
              onClick={onFinishPhase}
              className="w-full sm:w-2/3 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>Start Checking</span>
              <Rocket className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              onClick={() => setShowFinishScreen(true)}
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
    </div>
  );
};
