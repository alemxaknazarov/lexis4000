import { useState } from 'react';
import type { Word } from '../lib/supabase';

/**
 * Custom hook to encapsulate the learning session state and progression logic.
 * Decouples learning states from App.tsx monolit.
 */
export function useLearningSession() {
  const [learningPhase, setLearningPhase] = useState<number>(1);
  const [sessionEarnedXp, setSessionEarnedXp] = useState<number>(0);
  const [sessionWordPoints, setSessionWordPoints] = useState<Record<string, number>>({});
  const [sessionFailedWordIds, setSessionFailedWordIds] = useState<Set<string>>(new Set());
  const [isMistakesSession, setIsMistakesSession] = useState<boolean>(false);
  const [selectedWords, setSelectedWords] = useState<Word[]>([]);

  // Persistent set of learned words
  const [learnedWordIds, setLearnedWordIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('lexis_learned_word_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persistent word phase completion scores: word.id -> number of passed phases (0..5)
  const [wordPhaseScores, setWordPhaseScores] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('lexis_word_phase_scores');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  /**
   * Resets session progress for restarting a learning cycle
   */
  const resetSession = (words: Word[]) => {
    setSessionEarnedXp(0);
    setSessionFailedWordIds(new Set());
    const initialPoints: Record<string, number> = {};
    words.forEach((w) => {
      initialPoints[w.id] = 0;
    });
    setSessionWordPoints(initialPoints);
    setLearningPhase(1);
  };

  return {
    learningPhase,
    setLearningPhase,
    sessionEarnedXp,
    setSessionEarnedXp,
    sessionWordPoints,
    setSessionWordPoints,
    sessionFailedWordIds,
    setSessionFailedWordIds,
    isMistakesSession,
    setIsMistakesSession,
    selectedWords,
    setSelectedWords,
    learnedWordIds,
    setLearnedWordIds,
    wordPhaseScores,
    setWordPhaseScores,
    resetSession
  };
}
