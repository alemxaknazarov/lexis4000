import React, { useState, useEffect } from 'react';
import { Check, CheckSquare, Square, Volume2, Play, Sparkles } from 'lucide-react';
import type { Word } from '../lib/supabase';
import { speakWord, stopAudio } from '../utils/speech';

interface WordSelectorProps {
  bookNumber: number;
  unitNumber: number;
  words: Word[];
  learnedWordIds?: Set<string>;
  onStartLearning: (selectedWords: Word[]) => void;
}

export const WordSelector: React.FC<WordSelectorProps> = ({
  bookNumber,
  unitNumber,
  words,
  learnedWordIds,
  onStartLearning
}) => {
  const storageKey = `lexis_selected_words_${bookNumber}_${unitNumber}`;

  const loadSavedWordIds = (): Set<string> => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validIds = parsed.filter((id) => words.some((w) => w.id === id));
          if (validIds.length > 0) {
            return new Set(validIds);
          }
        }
      }
    } catch {
      // ignore parse error
    }
    return new Set();
  };

  // Default: load saved selection if any, else empty Set
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(loadSavedWordIds);

  // Update selection state when book or unit changes
  useEffect(() => {
    setSelectedWordIds(loadSavedWordIds());
  }, [bookNumber, unitNumber]);

  useEffect(() => {
    stopAudio();
    return () => {
      stopAudio();
    };
  }, []);

  const isAllSelected = words.length > 0 && selectedWordIds.size === words.length;

  const updateSelection = (newSet: Set<string>) => {
    setSelectedWordIds(newSet);
    if (newSet.size > 0) {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
    } else {
      localStorage.removeItem(storageKey);
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      updateSelection(new Set());
    } else {
      updateSelection(new Set(words.map((w) => w.id)));
    }
  };

  const toggleWord = (id: string) => {
    const updated = new Set(selectedWordIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    updateSelection(updated);
  };

  const handleStart = () => {
    stopAudio();
    const selected = words.filter((w) => selectedWordIds.has(w.id));
    if (selected.length === 0) return;
    onStartLearning(selected);
  };

  const masteredCount = words.filter((w) => learnedWordIds?.has(w.id)).length;

  return (
    <div className="py-4 sm:py-6 px-3.5 sm:px-6 max-w-4xl mx-auto pb-24 sm:pb-8">
      {/* Top Header Card */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 rounded-2xl mb-4 sm:mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-2.5 py-0.5 rounded-full mb-1">
            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Book {bookNumber} • Unit {unitNumber}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            So‘zlarni tanlang
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
            <span>
              Tanlandi: <strong className="text-slate-900 dark:text-white">{selectedWordIds.size}</strong> / {words.length} ta
            </span>
            {masteredCount > 0 && (
              <span className="border-l border-slate-200 dark:border-slate-800 pl-3">
                O‘zlashtirilgan: <strong className="text-emerald-600 dark:text-emerald-400">{masteredCount} ta</strong> ({Math.round((masteredCount / words.length) * 100)}%)
              </span>
            )}
          </div>
        </div>

        {/* Desktop Buttons (Hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer h-9"
          >
            {isAllSelected ? (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Bekor qilish</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 text-slate-400" />
                <span>Hammasini tanlash</span>
              </>
            )}
          </button>

          <button
            onClick={handleStart}
            disabled={selectedWordIds.size === 0}
            className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-xs shadow-xs transition cursor-pointer h-9 ${
              selectedWordIds.size > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Boshlash ({selectedWordIds.size})</span>
          </button>
        </div>
      </div>

      {/* Words List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {words.map((word) => {
          const isSelected = selectedWordIds.has(word.id);
          const isMastered = learnedWordIds?.has(word.id);

          return (
            <div
              key={word.id}
              onClick={() => toggleWord(word.id)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-500/60 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 opacity-75 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                {/* Thumbnail */}
                <img
                  src={word.image_url}
                  alt={word.word}
                  className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shrink-0"
                  loading="lazy"
                />

                {/* Word Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-sm capitalize">
                      {word.word}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      /{word.phonetic}/
                    </span>
                    {word.part_of_speech && (
                      <span className="text-[9px] uppercase font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                        {word.part_of_speech}
                      </span>
                    )}
                    {isMastered && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.2 rounded-full">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>O‘rganilgan</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium line-clamp-1 mt-0.5">
                    {word.translation_uz}
                  </p>
                </div>
              </div>

              {/* Audio Listen Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stopAudio();
                  speakWord(word.word, word.audio_url);
                }}
                title="Talaffuzni eshitish"
                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition shrink-0 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Mobile Fixed Bottom Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 px-3.5 py-2.5 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2.5">
          {/* Select All / Deselect button */}
          <button
            onClick={toggleSelectAll}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer active:scale-95"
          >
            {isAllSelected ? (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Bekor qilish</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Barchasi ({words.length})</span>
              </>
            )}
          </button>

          {/* Start Study Button */}
          <button
            onClick={handleStart}
            disabled={selectedWordIds.size === 0}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs shadow-sm transition cursor-pointer active:scale-95 ${
              selectedWordIds.size > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-white shrink-0" />
            <span className="truncate">
              {selectedWordIds.size > 0 ? `Boshlash (${selectedWordIds.size})` : 'So‘z tanlang'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
