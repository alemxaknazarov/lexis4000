import type { UserProfile } from '../lib/supabase';

export type AppView = 'catalog' | 'units' | 'words' | 'learning' | 'login' | 'profile' | 'leaderboard' | 'mistakes' | 'settings' | 'admin';

export interface RouteResolution {
  view: AppView;
  bookNumber: number;
  unitNumber: number;
  redirectUrl?: string;
}

/**
 * Route & Middleware Processor
 * 
 * Handled Middleware Guards:
 * 1. Auth Guard: Blocks guests from accessing /profile and redirects to /login.
 * 2. Book Param Guard: Validates book range 1..6, falls back to / if invalid.
 * 3. Unit Param Guard: Validates unit range 1..30, falls back to /book/:bookNumber if invalid.
 * 4. Path Normalizer: Trims trailing slashes.
 */
export function resolveRoute(pathname: string, userProfile: UserProfile | null): RouteResolution {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  // 1. Static Routes
  if (cleanPath === '' || cleanPath === '/') {
    return { view: 'catalog', bookNumber: 1, unitNumber: 1 };
  }

  if (cleanPath === '/admin-uchun') {
    return { view: 'admin', bookNumber: 1, unitNumber: 1 };
  }

  if (cleanPath === '/leaderboard') {
    return { view: 'leaderboard', bookNumber: 1, unitNumber: 1 };
  }

  if (cleanPath === '/mistakes') {
    return { view: 'mistakes', bookNumber: 1, unitNumber: 1 };
  }

  if (cleanPath === '/settings') {
    return { view: 'settings', bookNumber: 1, unitNumber: 1 };
  }

  if (cleanPath === '/login') {
    if (userProfile) {
      return { view: 'profile', bookNumber: 1, unitNumber: 1, redirectUrl: '/profile' };
    }
    return { view: 'login', bookNumber: 1, unitNumber: 1 };
  }

  // 2. Auth Guard Middleware for /profile
  if (cleanPath === '/profile') {
    if (!userProfile) {
      // Guest attempted protected route -> Redirect to /login
      return {
        view: 'login',
        bookNumber: 1,
        unitNumber: 1,
        redirectUrl: '/login'
      };
    }
    return { view: 'profile', bookNumber: 1, unitNumber: 1 };
  }

  // 3. Learning Route: /book/:bookNumber/unit/:unitNumber/learn
  const learnMatch = cleanPath.match(/^\/book\/(\d+)\/unit\/(\d+)\/learn$/);
  if (learnMatch) {
    const bookNum = parseInt(learnMatch[1], 10);
    const unitNum = parseInt(learnMatch[2], 10);

    // Validate Book
    if (bookNum < 1 || bookNum > 6) {
      return { view: 'catalog', bookNumber: 1, unitNumber: 1, redirectUrl: '/' };
    }
    // Validate Unit
    if (unitNum < 1 || unitNum > 30) {
      return { view: 'units', bookNumber: bookNum, unitNumber: 1, redirectUrl: `/book/${bookNum}` };
    }

    // Auth Guard: Guests must log in before starting learning session
    if (!userProfile) {
      return {
        view: 'login',
        bookNumber: bookNum,
        unitNumber: unitNum,
        redirectUrl: '/login'
      };
    }

    return { view: 'learning', bookNumber: bookNum, unitNumber: unitNum };
  }

  // 4. Words Selector Route: /book/:bookNumber/unit/:unitNumber
  const unitMatch = cleanPath.match(/^\/book\/(\d+)\/unit\/(\d+)$/);
  if (unitMatch) {
    const bookNum = parseInt(unitMatch[1], 10);
    const unitNum = parseInt(unitMatch[2], 10);

    // Validate Book
    if (bookNum < 1 || bookNum > 6) {
      return { view: 'catalog', bookNumber: 1, unitNumber: 1, redirectUrl: '/' };
    }
    // Validate Unit
    if (unitNum < 1 || unitNum > 30) {
      return { view: 'units', bookNumber: bookNum, unitNumber: 1, redirectUrl: `/book/${bookNum}` };
    }

    return { view: 'words', bookNumber: bookNum, unitNumber: unitNum };
  }

  // 5. Units Selector Route: /book/:bookNumber
  const bookMatch = cleanPath.match(/^\/book\/(\d+)$/);
  if (bookMatch) {
    const bookNum = parseInt(bookMatch[1], 10);

    // Validate Book
    if (bookNum < 1 || bookNum > 6) {
      return { view: 'catalog', bookNumber: 1, unitNumber: 1, redirectUrl: '/' };
    }

    return { view: 'units', bookNumber: bookNum, unitNumber: 1 };
  }

  // 6. Unknown 404 Route -> Fallback Middleware to Catalog
  return {
    view: 'catalog',
    bookNumber: 1,
    unitNumber: 1,
    redirectUrl: '/'
  };
}

/**
 * Clean URL Builders
 */
export const routes = {
  catalog: () => '/',
  login: () => '/login',
  profile: () => '/profile',
  leaderboard: () => '/leaderboard',
  mistakes: () => '/mistakes',
  settings: () => '/settings',
  admin: () => '/admin-uchun',
  book: (bookNumber: number) => `/book/${bookNumber}`,
  unit: (bookNumber: number, unitNumber: number) => `/book/${bookNumber}/unit/${unitNumber}`,
  learn: (bookNumber: number, unitNumber: number) => `/book/${bookNumber}/unit/${unitNumber}/learn`
};
