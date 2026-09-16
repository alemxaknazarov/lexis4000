import type { UserProfile } from '../lib/supabase';
import { supabase } from '../lib/supabase';

// 24 hours in milliseconds (1 full day)
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export const SESSION_KEYS = {
  PROFILE: 'lexis_user_profile',
  TIMESTAMP: 'lexis_session_timestamp',
  XP: 'lexis_xp',
  STREAK: 'lexis_streak',
  COOKIE_NAME: 'lexis_session'
};

/**
 * Sets session cookie with 24 hour expiry
 */
function setSessionCookie() {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${SESSION_KEYS.COOKIE_NAME}=active; max-age=86400; path=/; SameSite=Lax`;
  } catch (_) {}
}

/**
 * Clears session cookie
 */
function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${SESSION_KEYS.COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`;
  } catch (_) {}
}

/**
 * Saves user session to LocalStorage and Cookie with fresh 24-hour timestamp
 */
export function saveSession(profile: UserProfile) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SESSION_KEYS.PROFILE, JSON.stringify(profile));
    localStorage.setItem(SESSION_KEYS.TIMESTAMP, Date.now().toString());

    if (typeof profile.total_xp === 'number') {
      localStorage.setItem(SESSION_KEYS.XP, profile.total_xp.toString());
    }
    if (typeof profile.streak_days === 'number') {
      localStorage.setItem(SESSION_KEYS.STREAK, profile.streak_days.toString());
    }

    setSessionCookie();
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

/**
 * Loads session and validates 24-hour expiration window.
 * Returns UserProfile if valid, or null if expired/non-existent.
 */
export function loadValidSession(): UserProfile | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawProfile = localStorage.getItem(SESSION_KEYS.PROFILE);
    if (!rawProfile) return null;

    const rawTimestamp = localStorage.getItem(SESSION_KEYS.TIMESTAMP);
    const now = Date.now();

    if (rawTimestamp) {
      const lastActive = parseInt(rawTimestamp, 10);
      const elapsed = now - lastActive;

      // If more than 24 hours have passed since last activity, expire session
      if (isNaN(lastActive) || elapsed > SESSION_DURATION_MS) {
        console.info('[Session] 24 hours expired. Logging out automatically.');
        clearSession();
        return null;
      }
    }

    // Session is valid — refresh timestamp & cookie
    touchSession();
    return JSON.parse(rawProfile) as UserProfile;
  } catch (err) {
    console.error('Failed to load session:', err);
    return null;
  }
}

/**
 * Refreshes the last active timestamp so the 24-hour timer resets from latest user interaction
 */
export function touchSession() {
  if (typeof window === 'undefined') return;

  try {
    const rawProfile = localStorage.getItem(SESSION_KEYS.PROFILE);
    if (rawProfile) {
      localStorage.setItem(SESSION_KEYS.TIMESTAMP, Date.now().toString());
      setSessionCookie();
    }
  } catch (_) {}
}

/**
 * Explicitly terminates the session (user clicked Sign Out or session timed out)
 */
export function clearSession() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(SESSION_KEYS.PROFILE);
    localStorage.removeItem(SESSION_KEYS.TIMESTAMP);
    clearSessionCookie();
    supabase.auth.signOut().catch(() => {});
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}
