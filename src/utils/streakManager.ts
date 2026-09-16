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
 * Evaluates streak status based on previous study date and registration date.
 */
export function evaluateStreak(
  currentStreak: number,
  lastStudyDate: string | null | undefined,
  createdAt?: string | null
): StreakEvaluationResult {
  const todayStr = getLocalDateString();
  let prevDate: string | null = null;

  if (lastStudyDate) {
    prevDate = lastStudyDate.includes('T')
      ? getLocalDateString(new Date(lastStudyDate))
      : lastStudyDate;
  } else if (createdAt) {
    prevDate = getLocalDateString(new Date(createdAt));
  }

  // If no date reference exists at all, initialize to 1 today
  if (!prevDate) {
    return {
      newStreak: Math.max(1, currentStreak || 1),
      shouldUpdate: true,
      todayStr
    };
  }

  const diff = calculateDaysBetween(prevDate, todayStr);

  if (diff === 0) {
    // Same day visit: keep current streak, but save last_study_date if missing
    return {
      newStreak: Math.max(1, currentStreak || 1),
      shouldUpdate: !lastStudyDate,
      todayStr
    };
  } else if (diff === 1) {
    // Next consecutive day! Increment streak
    return {
      newStreak: Math.max(1, currentStreak || 1) + 1,
      shouldUpdate: true,
      todayStr
    };
  } else if (diff > 1) {
    // Missed 1 or more full days: reset streak to 1
    return {
      newStreak: 1,
      shouldUpdate: true,
      todayStr
    };
  } else {
    // Time travel / device clock anomaly (diff < 0): preserve current streak
    return {
      newStreak: Math.max(1, currentStreak || 1),
      shouldUpdate: false,
      todayStr
    };
  }
}

/**
 * Checks and updates streak for a user profile (or guest).
 * Persists changes to Supabase and LocalStorage.
 */
export async function checkAndUpdateStreak(
  profile: UserProfile | null,
  fallbackStreak: number = 1
): Promise<{ streak: number; profile: UserProfile | null }> {
  const todayStr = getLocalDateString();

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
        streak_days: newStreak,
        last_study_date: todayStr
      };

      try {
        await supabase
          .from('profiles')
          .update({
            streak_days: newStreak,
            last_study_date: todayStr
          })
          .eq('id', profile.id);
      } catch (err) {
        console.warn('Failed to update streak in Supabase:', err);
      }

      saveSession(updatedProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEYS.STREAK, newStreak.toString());
        localStorage.setItem('lexis_last_study_date', todayStr);
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
        guestStreak = parseInt(savedStreak, 10) || 1;
      }
    }

    const { newStreak, shouldUpdate } = evaluateStreak(guestStreak, guestLastDate);

    if (shouldUpdate && typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEYS.STREAK, newStreak.toString());
      localStorage.setItem('lexis_last_study_date', todayStr);
    }

    return { streak: newStreak, profile: null };
  }
}

/**
 * Records learning activity (e.g. completing a unit, learning words).
 * Ensures last_study_date is locked to today and synced with database.
 */
export async function recordStudyActivity(
  profile: UserProfile | null,
  currentStreak: number
): Promise<{ streak: number; profile: UserProfile | null }> {
  const todayStr = getLocalDateString();
  const streakToKeep = Math.max(1, currentStreak);

  if (profile) {
    const updatedProfile: UserProfile = {
      ...profile,
      streak_days: streakToKeep,
      last_study_date: todayStr
    };

    try {
      await supabase
        .from('profiles')
        .update({
          streak_days: streakToKeep,
          last_study_date: todayStr
        })
        .eq('id', profile.id);
    } catch (err) {
      console.warn('Failed to record study activity in Supabase:', err);
    }

    saveSession(updatedProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEYS.STREAK, streakToKeep.toString());
      localStorage.setItem('lexis_last_study_date', todayStr);
    }

    return { streak: streakToKeep, profile: updatedProfile };
  } else {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEYS.STREAK, streakToKeep.toString());
      localStorage.setItem('lexis_last_study_date', todayStr);
    }
    return { streak: streakToKeep, profile: null };
  }
}
