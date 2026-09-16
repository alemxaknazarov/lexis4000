import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Play, CheckCircle2, Trash2, Volume2, Sparkles } from 'lucide-react';
import type { Word } from '../lib/supabase';
import { getMistakeRecords, loadMistakeWords, removeMistake } from '../utils/mistakeManager';
import type { MistakeRecord } from '../utils/mistakeManager';
import { speakWord, stopAudio } from '../utils/speech';

interface MistakesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPractice: (words: Word[]) => void;
}

export const MistakesModal: React.FC<MistakesModalProps> = ({
  isOpen,
  onClose,
  onStartPractice
}) => {
  const [records, setRecords] = useState<MistakeRecord[]>([]);
  const [fullWords, setFullWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const recs = getMistakeRecords();
    setRecords(recs);
    if (recs.length > 0) {
      const words = await loadMistakeWords();
      setFullWords(words);
    } else {
      setFullWords([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
    return () => {
      stopAudio();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePractice = () => {
    if (fullWords.length > 0) {
      onClose();
      onStartPractice(fullWords);
    }
  };

  const handleRemove = (wordId: string) => {
    removeMistake(wordId);
    setRecords((prev) => prev.filter((r) => r.wordId !== wordId));
    setFullWords((prev) => prev.filter((w) => w.id !== wordId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Yopish"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Xatolar Banki</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono font-bold">
                {records.length} ta
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Avval adashilgan so‘zlarni mustahkamlash
            </p>
          </div>
        </div>

        {/* Action button if has mistakes */}
        {fullWords.length > 0 && (
          <button
            onClick={handlePractice}
            className="w-full mb-3.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Xatolarni mashq qilish ({fullWords.length} ta so‘z)</span>
          </button>
        )}

        {/* List of mistaken words */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <Sparkles className="w-5 h-5 animate-spin text-emerald-500" />
              <span>Yuklanmoqda...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Ajoyib! Sizda xatolar yo‘q.
              </span>
              <span className="text-[11px] text-slate-400">
                Mashqlarda adashilgan so‘zlar avtomatik shu yerda to‘planadi.
              </span>
            </div>
          ) : (
            records.map((item) => (
              <div
                key={item.wordId}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {item.word}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        stopAudio();
                        speakWord(item.word);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                      title="Talaffuzi"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                    {item.translation_uz}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Kitob {item.bookNumber} • Unit {item.unitNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                    {item.count} marta xato
                  </span>
                  <button
                    onClick={() => handleRemove(item.wordId)}
                    title="Xatolar ro‘yxatidan o‘chirish"
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
