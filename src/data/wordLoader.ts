import type { Word } from '../lib/supabase';

const bookCache = new Map<number, Word[]>();

/**
 * Dynamically loads words for a specific book on demand.
 * This keeps the main initial JavaScript bundle lightweight (<200KB)
 * and loads books asynchronously when needed.
 */
export async function loadBookWords(bookNumber: number): Promise<Word[]> {
  const bNum = Math.max(1, Math.min(6, bookNumber || 1));

  if (bookCache.has(bNum)) {
    return bookCache.get(bNum)!;
  }

  let words: Word[] = [];

  switch (bNum) {
    case 1: {
      const m = await import('./book1Words');
      words = m.BOOK_1_WORDS;
      break;
    }
    case 2: {
      const m = await import('./book2Words');
      words = m.BOOK_2_WORDS;
      break;
    }
    case 3: {
      const m = await import('./book3Words');
      words = m.BOOK_3_WORDS;
      break;
    }
    case 4: {
      const m = await import('./book4Words');
      words = m.BOOK_4_WORDS;
      break;
    }
    case 5: {
      const m = await import('./book5Words');
      words = m.BOOK_5_WORDS;
      break;
    }
    case 6: {
      const m = await import('./book6Words');
      words = m.BOOK_6_WORDS;
      break;
    }
    default: {
      const m = await import('./book1Words');
      words = m.BOOK_1_WORDS;
      break;
    }
  }

  bookCache.set(bNum, words);
  return words;
}
