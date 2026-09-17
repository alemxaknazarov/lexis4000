import type { UserProfile } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { SESSION_KEYS, saveSession } from './sessionManager';

/**
 * Returns the current date formatted as YYYY-MM-DD in the user's local timezone.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD date strings.
 * Uses UTC midnight to eliminate daylight saving or time-of-day offsets.
 */
export function calculateDaysBetween(fromDateStr: string, toDateStr: string): number {
  const [y1, m1, d1] = fromDateStr.split('-').map(Number);
  const [y2, m2, d2] = toDateStr.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / msPerDay);
}

export interface StreakEvaluationResult {
  newStreak: number;
  shouldUpdate: boolean;
  todayStr: string;
}

/**
 * Evaluates streak status purely on site visit (passive check).
 * Rule: Entering the site does NOT increment streak.
 * Only if user missed 1 or more days (diff > 1), streak resets to 0.
 */
export function evaluateStreak(
  currentStreak: number,
  lastStudyDate: string | null | undefined,
  _createdAt?: string | null
): StreakEvaluationResult {
  const todayStr = getLocalDateString();
  let prevDate: string | null = null;

  if (lastStudyDate) {
    prevDate = lastStudyDate.includes('T')
      ? getLocalDateString(new Date(lastStudyDate))
      : lastStudyDate;
  }

  // If user has never completed a 5-phase word, streak is 0
  if (!prevDate) {
    return {
      newStreak: 0,
      shouldUpdate: currentStreak !== 0,
      todayStr
    };
  }

  const diff = calculateDaysBetween(prevDate, todayStr);

  if (diff === 0) {
    // Already completed today: keep current streak
    return {
      newStreak: currentStreak,
      shouldUpdate: false,
      todayStr
    };
  } else if (diff === 1) {
    // Completed yesterday: streak is safe at currentStreak, waiting for today's 5-phase completion
    return {
      newStreak: currentStreak,
      shouldUpdate: false,
      todayStr
    };
  } else if (diff > 1) {
    // Missed 1 or more full days: streak resets to 0!
    return {
      newStreak: 0,
      shouldUpdate: currentStreak !== 0,
      todayStr
    };
  } else {
    // Clock anomaly (future date)
    return {
      newStreak: currentStreak,
      shouldUpdate: false,
      todayStr
    };
  }
}

/**
 * Checks and validates streak status on site entry or focus.
 * If user missed a day (diff > 1), resets streak to 0 in Supabase and LocalStorage.
 */
export async function checkAndUpdateStreak(
  profile: UserProfile | null,
  fallbackStreak: number = 0
): Promise<{ streak: number; profile: UserProfile | null }> {
  if (profile) {
    const currentStreak = typeof profile.streak_days === 'number' ? profile.streak_days : fallbackStreak;
    const { newStreak, shouldUpdate } = evaluateStreak(
      currentStreak,
      profile.last_study_date,
      (profile as any).created_at
    );

    if (shouldUpdate) {
      const updatedProfile: UserProfile = {
        ...profile,
        streak_days: newStreak
      };

      try {
        await supabase
          .from('profiles')
          .update({
            streak_days: newStreak
          })
          .eq('id', profile.id);
      } catch (err) {
        console.warn('Failed to update streak in Supabase:', err);
      }

      saveSession(updatedProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEYS.STREAK, newStreak.toString());
      }

      return { streak: newStreak, profile: updatedProfile };
    }

    return { streak: currentStreak, profile };
  } else {
    // Guest mode streak check using localStorage
    let guestLastDate: string | null = null;
    let guestStreak = fallbackStreak;

    if (typeof window !== 'undefined') {
      guestLastDate = localStorage.getItem('lexis_last_study_date');
      const savedStreak = localStorage.getItem(SESSION_KEYS.STREAK);
      if (savedStreak) {
        guestStreak = parseInt(savedStreak, 10) || 0;
      }
    }

    const { newStreak, shouldUpdate } = evaluateStreak(guestStreak, guestLastDate);

    if (shouldUpdate && typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEYS.STREAK, newStreak.toString());
    }

    return { streak: newStreak, profile: null };
  }
}

/**
 * Records learning activity.
 * CALLED ONLY WHEN AT LEAST 1 WORD HAS SUCCESSFULLY COMPLETED ALL 5 PHASES.
 * 
 * Rules:
 * - If user already completed a 5-phase word today: keeps current streak (doesn't double count).
 * - If user completed a 5-phase word yesterday: increments streak (+1 day).
 * - If user was at 0 (new or missed days): starts streak at 1 day.
 */
export async function recordStudyActivity(
  profile: UserProfile | null,
  currentStreak: number
): Promise<{ streak: number; profile: UserProfile | null }> {
  const todayStr = getLocalDateString();
  const nowIso = new Date().toISOString();

  let prevDate: string | null = null;
  if (profile?.last_study_date) {
    prevDate = profile.last_study_date.includes('T')
      ? getLocalDateString(new Date(profile.last_study_date))
      : profile.last_study_date;
  } else if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('lexis_last_study_date');
    if (saved) {
      prevDate = saved.includes('T') ? getLocalDateString(new Date(saved)) : saved;
    }
  }

  let nextStreak = currentStreak;

  if (!prevDate) {
    // First time completing a 5-phase word ever
    nextStreak = 1;
  } else {
    const diff = calculateDaysBetween(prevDate, todayStr);
    if (diff === 0) {
      // Already completed at least one 5-phase word today: keep streak
      nextStreak = Math.max(1, currentStreak);
    } else if (diff === 1) {
      // Consecutive day! Completed yesterday and now completing today: +1 day
      nextStreak = currentStreak + 1;
    } else {
      // Missed 1 or more days: restarts new streak at 1
      nextStreak = 1;
    }
  }

  if (profile) {
    const updatedProfile: UserProfile = {
      ...profile,
      streak_days: nextStreak,
      last_study_date: nowIso
    };

    try {
      await supabase
        .from('profiles')
        .update({
          streak_days: nextStreak,
          last_study_date: nowIso
        })
        .eq('id', profile.id);
    } catch (err) {
      console.warn('Failed to record study activity in Supabase:', err);
    }

    saveSession(updatedProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEYS.STREAK, nextStreak.toString());
      localStorage.setItem('lexis_last_study_date', todayStr);
    }

    return { streak: nextStreak, profile: updatedProfile };
  } else {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEYS.STREAK, nextStreak.toString());
      localStorage.setItem('lexis_last_study_date', todayStr);
    }
    return { streak: nextStreak, profile: null };
  }
}
