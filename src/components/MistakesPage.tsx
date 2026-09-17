import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  CheckSquare,
  Square,
  Play,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Check,
  Filter,
  Trophy
} from 'lucide-react';
import type { Word, UserProfile } from '../lib/supabase';
import { getMistakeRecords, loadMistakeWords } from '../utils/mistakeManager';
import type { MistakeRecord } from '../utils/mistakeManager';
import { speakWord, stopAudio, preloadWordAudios } from '../utils/speech';
import { sounds } from '../utils/soundEffects';

interface MistakesPageProps {
  onStartLearning: (selectedWords: Word[]) => void;
  onGoHome: () => void;
  onGoBack: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
}

export const MistakesPage: React.FC<MistakesPageProps> = ({
  onStartLearning,
  onGoHome,
  onGoBack,
  userProfile,
  onOpenAuth,
  onOpenProfile,
  onOpenLeaderboard
}) => {
  const [records, setRecords] = useState<MistakeRecord[]>([]);
  const [fullWords, setFullWords] = useState<Word[]>([]);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookFilter, setSelectedBookFilter] = useState<number | 'all'>('all');
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const loadData = async () => {
    setLoading(true);
    const recs = getMistakeRecords();
    setRecords(recs);
    if (recs.length > 0) {
      const words = await loadMistakeWords();
      setFullWords(words);
      // By default select all mistake words
      setSelectedWordIds(new Set(words.map((w) => w.id)));
      preloadWordAudios(words.map((w) => w.audio_url));
    } else {
      setFullWords([]);
      setSelectedWordIds(new Set());
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    return () => {
      stopAudio();
    };
  }, []);

  // Filtered words
  const filteredWords = useMemo(() => {
    return fullWords.filter((w) => {
      const matchesSearch =
        w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.translation_uz.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBook = selectedBookFilter === 'all' || w.book_number === selectedBookFilter;
      return matchesSearch && matchesBook;
    });
  }, [fullWords, searchQuery, selectedBookFilter]);

  const toggleWord = (wordId: string) => {
    sounds.playClick();
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  };

  const isAllSelected =
    filteredWords.length > 0 && filteredWords.every((w) => selectedWordIds.has(w.id));

  const toggleSelectAll = () => {
    sounds.playClick();
    if (isAllSelected) {
      setSelectedWordIds((prev) => {
        const next = new Set(prev);
        filteredWords.forEach((w) => next.delete(w.id));
        return next;
      });
    } else {
      setSelectedWordIds((prev) => {
        const next = new Set(prev);
        filteredWords.forEach((w) => next.add(w.id));
        return next;
      });
    }
  };

  const handleStart = () => {
    const selected = fullWords.filter((w) => selectedWordIds.has(w.id));
    if (selected.length === 0) return;
    sounds.playClick();
    onStartLearning(selected);
  };

  const handlePlayAudio = (e: React.MouseEvent, word: Word) => {
    e.stopPropagation();
    stopAudio();
    setPlayingWordId(word.id);
    speakWord(word.word, word.audio_url);
    setTimeout(() => {
      setPlayingWordId(null);
    }, 1200);
  };

  // Available book numbers in current mistakes
  const availableBooks = Array.from(new Set(fullWords.map((w) => w.book_number))).sort(
    (a, b) => a - b
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-rose-500/20">
      {/* 1. Standard Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Left: Brand Logo */}
          <div
            onClick={onGoHome}
            className="flex items-center cursor-pointer select-none py-1 shrink-0"
            title="Bosh sahifa"
          >
            <img
              src="/logo.png"
              alt="LEXIS 4000"
              className="h-7 sm:h-9 w-auto object-contain dark:hidden transition-transform hover:scale-105"
            />
            <img
              src="/logo-dark.png"
              alt="LEXIS 4000"
              className="h-7 sm:h-9 w-auto object-contain hidden dark:block transition-transform hover:scale-105"
            />
          </div>

          {/* Right Action Controls: Leaderboard, Profile/Auth, Orqaga */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenLeaderboard}
              title="Reyting (Top o‘quvchilar)"
              className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer shrink-0"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
            </button>

            {userProfile ? (
              <button
                onClick={onOpenProfile}
                title="Profil sahifasi"
                className="hidden sm:flex w-8 h-8 rounded-full overflow-hidden bg-emerald-600 text-white items-center justify-center font-bold text-xs shrink-0 cursor-pointer border border-slate-200 dark:border-slate-800"
              >
                {userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  userProfile.full_name?.charAt(0).toUpperCase() || 'U'
                )}
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
              >
                Kirish
              </button>
            )}

            <button
              onClick={onGoBack}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Orqaga</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Mistakes Page Content */}
      <main className="flex-1 pt-20 sm:pt-24 pb-44 sm:pb-16 max-w-5xl w-full mx-auto px-4 sm:px-6 animate-fadeIn">
        {/* Hero Header Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs mb-6 relative overflow-hidden transition-colors">
          <div className="absolute -top-20 right-0 w-72 h-72 bg-rose-500/10 dark:bg-rose-500/8 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs font-bold mb-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Xatolar Banki • {fullWords.length} ta so‘z</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1.5">
                Xatolar Ustida Ishlash
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Avvalgi mashqlarda xato qilingan so‘zlarni tanlang va 5 ta bosqichdan qayta o‘tkazing. To‘liq va xatosiz o‘tilgan so‘zlar avtomatik ravishda ushbu ro‘yxatdan o‘chiriladi.
              </p>
            </div>

            {/* Desktop Quick Start */}
            {fullWords.length > 0 && (
              <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
                <button
                  onClick={handleStart}
                  disabled={selectedWordIds.size === 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition cursor-pointer active:scale-95 ${
                    selectedWordIds.size > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Mashqni Boshlash ({selectedWordIds.size})</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  Tanlangan: <strong>{selectedWordIds.size}</strong> / {fullWords.length} ta
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Sparkles className="w-7 h-7 animate-spin text-emerald-500" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Xatolar yuklanmoqda...
            </p>
          </div>
        ) : fullWords.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Ajoyib! Sizda xatolar yo‘q 🎉
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm leading-relaxed">
              Barcha mashqlar xatosiz bajarilgan. Yangi so‘zlarni o‘rganish uchun kitoblar katalogiga o‘tishingiz mumkin.
            </p>
            <button
              onClick={onGoHome}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              Kitoblar katalogiga o‘tish
            </button>
          </div>
        ) : (
          /* Words Selection Section */
          <>
            {/* Toolbar: Search, Filter & Select All */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Xatolarni qidirish (inglizcha yoki o‘zbekcha)..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Controls: Book filter & Select All */}
              <div className="flex items-center gap-2">
                {/* Book Filter Dropdown if multiple books exist */}
                {availableBooks.length > 1 && (
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={selectedBookFilter}
                      onChange={(e) =>
                        setSelectedBookFilter(
                          e.target.value === 'all' ? 'all' : Number(e.target.value)
                        )
                      }
                      aria-label="Kitob bo‘yicha saralash"
                      className="bg-transparent text-xs font-semibold focus:outline-hidden cursor-pointer"
                    >
                      <option value="all">Barcha kitoblar</option>
                      {availableBooks.map((bNum) => (
                        <option key={bNum} value={bNum}>
                          Book {bNum}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Select All Button */}
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
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
              </div>
            </div>

            {/* Word Cards Grid (Identical to Unit Words Selector UX) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {filteredWords.map((word) => {
                const isSelected = selectedWordIds.has(word.id);
                const rec = records.find((r) => r.wordId === word.id);
                const mistakeCount = rec?.count || 1;

                return (
                  <div
                    key={word.id}
                    onClick={() => toggleWord(word.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50/50 dark:bg-rose-950/25 border-rose-400/70 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 opacity-80 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Left: Checkbox + Image + Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                        <img
                          src={word.image_url}
                          alt={word.word}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Text details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize truncate">
                            {word.word}
                          </h4>
                          {word.part_of_speech && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0">
                              {word.part_of_speech}
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">
                          {word.translation_uz}
                        </p>

                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400">
                            B{word.book_number} • U{word.unit_number}
                          </span>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded">
                            {mistakeCount}x xato
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Audio Action */}
                    <div className="flex items-center shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => handlePlayAudio(e, word)}
                        title="Talaffuzni eshitish"
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border transition cursor-pointer ${
                          playingWordId === word.id
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border-emerald-300 scale-105'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* 3. Mobile Fixed Bottom Bar (Floats cleanly right above MobileBottomNav) */}
      {fullWords.length > 0 && (
        <div className="sm:hidden fixed bottom-[76px] left-3 right-3 z-40 max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-2.5 shadow-xl transition-all">
          <div className="max-w-md mx-auto flex items-center justify-between gap-2.5">
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
                  <span className="truncate">Barchasi ({filteredWords.length})</span>
                </>
              )}
            </button>

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
                {selectedWordIds.size > 0 ? `Boshlash (${selectedWordIds.size})` : 'Tanlang'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
