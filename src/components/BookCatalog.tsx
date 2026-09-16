import React from 'react';
import { CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import type { Book } from '../lib/supabase';
import { BookCover } from './BookCover';

interface BookCatalogProps {
  books: Book[];
  onSelectBook: (bookNumber: number) => void;
  getUnitCompletionCount: (bookNumber: number) => number;
}

export const BookCatalog: React.FC<BookCatalogProps> = ({
  books,
  onSelectBook,
  getUnitCompletionCount
}) => {
  const levels = [
    { num: 1, cefr: 'A2', desc: 'Elementary & Basic Vocabulary' },
    { num: 2, cefr: 'A2-B1', desc: 'Pre-Intermediate Foundations' },
    { num: 3, cefr: 'B1', desc: 'Intermediate Contextual Fluency' },
    { num: 4, cefr: 'B1-B2', desc: 'Upper-Intermediate Power Words' },
    { num: 5, cefr: 'B2', desc: 'Advanced Academic Vocabulary' },
    { num: 6, cefr: 'B2-C1', desc: 'Master Lexicon (IELTS 7.5+)' },
  ];

  return (
    <div className="py-5 sm:py-10 px-3.5 sm:px-6 max-w-6xl mx-auto overflow-hidden">
      {/* Hero Welcome */}
      <div className="text-center max-w-xl mx-auto mb-5 sm:mb-9">
        <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-2.5 sm:px-3 py-1 rounded-full mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>4000 Essential English Words</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5">
          Kitobni tanlang
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          5 bosqichli neyrolingvistik so‘z yodlash tizimi
        </p>
      </div>

      {/* Grid of 6 Books */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {books.map((book) => {
          const meta = levels.find((l) => l.num === book.book_number) || levels[0];
          const completedUnits = getUnitCompletionCount(book.book_number);
          const percent = Math.round((completedUnits / (book.total_units || 30)) * 100);

          return (
            <div
              key={book.book_number}
              onClick={() => onSelectBook(book.book_number)}
              className="group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/80 dark:hover:border-emerald-500/80 rounded-2xl p-3.5 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
            >
              {/* Main Content: 3D Book Cover + Info */}
              <div className="flex gap-3.5 sm:gap-4 items-start mb-3.5">
                {/* 3D Book Cover */}
                <div className="w-20 sm:w-24 md:w-28 shrink-0 transition-transform duration-300 group-hover:scale-[1.03]">
                  <BookCover
                    bookNumber={book.book_number}
                    altTitle={book.title}
                  />
                </div>

                {/* Book Meta Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                      <span className="text-[10px] sm:text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                        KITOB {book.book_number}
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        CEFR {meta.cefr}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {meta.desc}
                    </p>
                  </div>

                  <div className="mt-2 text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>30 ta Unit • 600 ta so‘z</span>
                  </div>
                </div>
              </div>

              {/* Progress and Action Footer */}
              <div className="pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>O‘zlashtirish: {completedUnits} / {book.total_units || 30} unit</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{percent}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2.5 sm:mb-3">
                  <div
                    className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Paul Nation</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Ochish</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
