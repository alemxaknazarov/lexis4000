import type { Word } from '../lib/supabase';
import { loadBookWords } from '../data/wordLoader';

const MISTAKES_KEY = 'lexis_mistake_records';

export interface MistakeRecord {
  wordId: string;
  bookNumber: number;
  unitNumber: number;
  word: string;
  translation_uz: string;
  count: number;
  lastMistakeAt: number;
}

/**
 * Retrieves list of all recorded mistakes
 */
export function getMistakeRecords(): MistakeRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MISTAKES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Returns total count of active mistakes
 */
export function getMistakeCount(): number {
  return getMistakeRecords().length;
}

/**
 * Records a mistake when user answers incorrectly in any phase
 */
export function recordMistake(word: Word): void {
  if (typeof window === 'undefined' || !word) return;
  try {
    const records = getMistakeRecords();
    const existingIndex = records.findIndex((r) => r.wordId === word.id);

    if (existingIndex >= 0) {
      records[existingIndex].count += 1;
      records[existingIndex].lastMistakeAt = Date.now();
    } else {
      records.push({
        wordId: word.id,
        bookNumber: word.book_number,
        unitNumber: word.unit_number,
        word: word.word,
        translation_uz: word.translation_uz,
        count: 1,
        lastMistakeAt: Date.now()
      });
    }

    localStorage.setItem(MISTAKES_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event('lexis_mistakes_updated'));
  } catch (err) {
    console.error('Failed to record mistake:', err);
  }
}

/**
 * Removes a mistake once the user masters/corrects it
 */
export function removeMistake(wordId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const records = getMistakeRecords().filter((r) => r.wordId !== wordId);
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event('lexis_mistakes_updated'));
  } catch (err) {
    console.error('Failed to remove mistake:', err);
  }
}

/**
 * Loads full Word objects for all recorded mistakes across books
 */
export async function loadMistakeWords(): Promise<Word[]> {
  const records = getMistakeRecords();
  if (records.length === 0) return [];

  // Group by book to minimize dynamic imports
  const bookNumbers = Array.from(new Set(records.map((r) => r.bookNumber)));
  const mistakeWords: Word[] = [];

  for (const bNum of bookNumbers) {
    const bookWords = await loadBookWords(bNum);
    const targetIds = new Set(records.filter((r) => r.bookNumber === bNum).map((r) => r.wordId));
    bookWords.forEach((w) => {
      if (targetIds.has(w.id)) {
        mistakeWords.push(w);
      }
    });
  }

  return mistakeWords;
}
