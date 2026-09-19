import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Book, Word, UserProfile, UnitProgress } from './lib/supabase';
import { loadBookWords } from './data/wordLoader';
import { Navbar } from './components/Navbar';
import { BookCatalog } from './components/BookCatalog';
import { UnitSelector } from './components/UnitSelector';
import { WordSelector } from './components/WordSelector';
import { Phase1Flashcard } from './components/learning/Phase1Flashcard';
import { Phase2Spelling } from './components/learning/Phase2Spelling';
import { Phase3Quiz } from './components/learning/Phase3Quiz';
import { Phase4Voice } from './components/learning/Phase4Voice';
import { Phase5Visual } from './components/learning/Phase5Visual';
import { Phase6Summary } from './components/learning/Phase6Summary';
import { AuthModal } from './components/AuthModal';
import { LeaderboardPage } from './components/LeaderboardPage';
import { MistakesPage } from './components/MistakesPage';
import { LoginPage } from './components/LoginPage';
import { ProfilePage } from './components/ProfilePage';
import { SettingsPage } from './components/SettingsPage';
import { AdminPage } from './components/AdminPage';
import { MobileBottomNav } from './components/MobileBottomNav';
import { resolveRoute, routes, type AppView } from './router/routes';
import { stopAudio } from './utils/speech';
import { loadValidSession, saveSession, touchSession, clearSession } from './utils/sessionManager';
import { checkAndUpdateStreak, recordStudyActivity } from './utils/streakManager';
import { getMistakeCount, removeMistake } from './utils/mistakeManager';

export type ThemeMode = 'system' | 'light' | 'dark';

export function App() {
  // Theme State: defaults to 'system' (matches device appearance automatically on first visit)
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('lexis_theme_mode');
    if (saved === 'system' || saved === 'light' || saved === 'dark') {
      return saved;
    }
    return 'system';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Dynamic listener for OS/system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const isDark = themeMode === 'system' ? systemTheme === 'dark' : themeMode === 'dark';

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('lexis_theme_mode', mode);
  };

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    handleSetThemeMode(next);
  };

  // User Profile State (Initialized early for Auth Guard Middleware with 24-hour expiration)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    return loadValidSession();
  });

  // Navigation View State with Middleware Resolution
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const res = resolveRoute(
      typeof window !== 'undefined' ? window.location.pathname : '/',
      userProfile
    );
    if (typeof window !== 'undefined' && res.redirectUrl) {
      window.history.replaceState(null, '', res.redirectUrl);
    }
    return res.view;
  });

  const [selectedBook, setSelectedBook] = useState<number>(() => {
    const res = resolveRoute(
      typeof window !== 'undefined' ? window.location.pathname : '/',
      userProfile
    );
    return res.bookNumber;
  });

  const [selectedUnit, setSelectedUnit] = useState<number>(() => {
    const res = resolveRoute(
      typeof window !== 'undefined' ? window.location.pathname : '/',
      userProfile
    );
    return res.unitNumber;
  });

  const [learningPhase, setLearningPhase] = useState<number>(1);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  // Unified Navigation with Middleware
  const navigate = (path: string, replace = false) => {
    stopAudio();
    scrollToTop();
    const res = resolveRoute(path, userProfile);
    const targetPath = res.redirectUrl || path;

    if (typeof window !== 'undefined') {
      if (replace) {
        window.history.replaceState(null, '', targetPath);
      } else {
        window.history.pushState(null, '', targetPath);
      }
    }

    setCurrentView(res.view);
    setSelectedBook(res.bookNumber);
    setSelectedUnit(res.unitNumber);
  };

  // Sync with browser URL & PopState (Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      scrollToTop();
      const res = resolveRoute(window.location.pathname, userProfile);
      if (res.redirectUrl) {
        window.history.replaceState(null, '', res.redirectUrl);
      }
      setCurrentView(res.view);
      setSelectedBook(res.bookNumber);
      setSelectedUnit(res.unitNumber);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [userProfile]);

  // Data States
  const [books, setBooks] = useState<Book[]>([
    { id: 1, book_number: 1, title: 'Book 1 - Elementary', total_units: 30 },
    { id: 2, book_number: 2, title: 'Book 2 - Pre-Intermediate', total_units: 30 },
    { id: 3, book_number: 3, title: 'Book 3 - Intermediate', total_units: 30 },
    { id: 4, book_number: 4, title: 'Book 4 - Upper-Intermediate', total_units: 30 },
    { id: 5, book_number: 5, title: 'Book 5 - Advanced', total_units: 30 },
    { id: 6, book_number: 6, title: 'Book 6 - Master', total_units: 30 },
  ]);
  const [allWords, setAllWords] = useState<Word[]>([]);

  // Dynamically load words for the selected book on demand (Code Splitting)
  useEffect(() => {
    let isMounted = true;
    loadBookWords(selectedBook)
      .then((words) => {
        if (isMounted) {
          setAllWords(words);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [selectedBook]);
  const [selectedWords, setSelectedWords] = useState<Word[]>([]);

  // Gamification State
  const [xp, setXp] = useState<number>(() => {
    return parseInt(localStorage.getItem('lexis_xp') || '0', 10);
  });
  const [sessionEarnedXp, setSessionEarnedXp] = useState<number>(0);
  const [streak, setStreak] = useState<number>(() => {
    return parseInt(localStorage.getItem('lexis_streak') || '0', 10);
  });
  const [unitProgressList, setUnitProgressList] = useState<UnitProgress[]>(() => {
    const saved = localStorage.getItem('lexis_progress');
    return saved ? JSON.parse(saved) : [];
  });
  const [learnedWordIds, setLearnedWordIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('lexis_learned_word_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  // Word Phase Scores: word.id -> number of passed phases (0..5)
  const [wordPhaseScores, setWordPhaseScores] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('lexis_word_phase_scores');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  // In-session points per word (word.id -> passed phases in current session: 0..5)
  const [sessionWordPoints, setSessionWordPoints] = useState<Record<string, number>>({});
  // In-session failed word IDs (words that failed with 2 mistakes in any phase)
  const [sessionFailedWordIds, setSessionFailedWordIds] = useState<Set<string>>(new Set());
  const [isMistakesSession, setIsMistakesSession] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [mistakeCount, setMistakeCount] = useState<number>(() => getMistakeCount());

  useEffect(() => {
    const handleUpdate = () => setMistakeCount(getMistakeCount());
    window.addEventListener('lexis_mistakes_updated', handleUpdate);
    return () => window.removeEventListener('lexis_mistakes_updated', handleUpdate);
  }, []);

  // Stop audio and scroll to top on any view, phase, unit, or book change
  useEffect(() => {
    stopAudio();
    scrollToTop();
  }, [currentView, learningPhase, selectedUnit, selectedBook]);

  // User activity tracker: resets 24-hour session window on active interaction,
  // and checks expiry when user returns to tab after being away.
  useEffect(() => {
    if (!userProfile) return;

    const handleUserInteraction = () => {
      touchSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const activeProfile = loadValidSession();
        if (!activeProfile) {
          // Expired after > 24 hours of inactivity
          setUserProfile(null);
          navigate(routes.login());
        }
      }
    };

    window.addEventListener('click', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userProfile]);

  // Fetch book words from Supabase on book change
  useEffect(() => {
    const fetchBookWords = async () => {
      try {
        const { data, error } = await supabase
          .from('words')
          .select('*')
          .eq('book_number', selectedBook);
        if (!error && data && data.length > 0) {
          const sorted = [...data].sort((a, b) => {
            if (a.unit_number !== b.unit_number) return a.unit_number - b.unit_number;
            const aIdx = parseInt(a.id.split('_w')[1] || '0', 10);
            const bIdx = parseInt(b.id.split('_w')[1] || '0', 10);
            return aIdx - bIdx;
          });
          setAllWords((prev) => {
            const others = prev.filter((w) => w.book_number !== selectedBook);
            return [...others, ...sorted];
          });
        }
      } catch (e) {
        console.warn('Using local words fallback for book', selectedBook);
      }
    };
    fetchBookWords();
  }, [selectedBook]);

  // Initialize Supabase Data & Auth Session with 24-hour persistence
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data, error } = await supabase.from('books').select('*').order('book_number');
        if (!error && data && data.length > 0) {
          setBooks(data);
        }
      } catch (e) {
        console.warn('Using local books config');
      }
    };
    fetchBooks();

    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const u = data.session.user;
          const profile: UserProfile = {
            id: u.id,
            full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'O‘quvchi',
            avatar_url: u.user_metadata?.avatar_url,
            total_xp: xp,
            streak_days: streak
          };
          const streakRes = await checkAndUpdateStreak(profile, streak);
          const finalProf = streakRes.profile || profile;
          saveSession(finalProf);
          setUserProfile(finalProf);
          setStreak(streakRes.streak);
        } else {
          // If no Supabase OAuth session, check Telegram session in localStorage
          const current = loadValidSession();
          if (current) {
            try {
              const { data: dbProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', current.id)
                .maybeSingle();

              const baseProfile: UserProfile = dbProfile ? { ...current, ...dbProfile } : current;
              const streakRes = await checkAndUpdateStreak(baseProfile, streak);
              const updatedProfile = streakRes.profile || baseProfile;

              saveSession(updatedProfile);
              setUserProfile(updatedProfile);
              if (typeof updatedProfile.total_xp === 'number') {
                setXp(updatedProfile.total_xp);
              }
              setStreak(streakRes.streak);

              if (updatedProfile.telegram_id) {
                try {
                  const { data: codeData } = await supabase
                    .from('telegram_auth_codes')
                    .select('last_name')
                    .eq('telegram_id', updatedProfile.telegram_id)
                    .like('last_name', '%|goal:%')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                  if (codeData?.last_name) {
                    const match = codeData.last_name.match(/\|goal:(ielts|cefr)_([^_]+)_(\d+)/);
                    if (match) {
                      const [, track, target, daily] = match;
                      if (track) localStorage.setItem('lexis_learning_track', track);
                      if (target) localStorage.setItem('lexis_target_level', target);
                      if (daily) localStorage.setItem('lexis_daily_goal', daily);
                    }
                  }
                } catch (goalErr) {
                  console.warn('Bot goal sync error:', goalErr);
                }
              }
            } catch (err) {
              console.warn('Profiles sync error:', err);
            }
          } else {
            // Guest mode: check streak in localStorage
            const guestStreakRes = await checkAndUpdateStreak(null, streak);
            setStreak(guestStreakRes.streak);
          }
        }
      } catch (e) {
        console.warn('Guest mode');
        const guestStreakRes = await checkAndUpdateStreak(null, streak);
        setStreak(guestStreakRes.streak);
      }
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        const profile: UserProfile = {
          id: u.id,
          full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'O‘quvchi',
          avatar_url: u.user_metadata?.avatar_url,
          total_xp: xp,
          streak_days: streak
        };
        saveSession(profile);
        setUserProfile(profile);
      }
      // Note: Do NOT call setUserProfile(null) when session is null,
      // because Telegram OTP auth is stored in localStorage / cookies and expires after 24 hours.
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Save Progress to LocalStorage and Supabase
  const saveUnitProgress = async (
    bookNum: number,
    unitNum: number,
    accuracy: number,
    isCompleted: boolean,
    learnedCount: number,
    earnedXpForSession: number,
    hasCompletedFullWord: boolean = false
  ) => {
    const updated = [...unitProgressList.filter(p => !(p.book_number === bookNum && p.unit_number === unitNum))];
    updated.push({
      book_number: bookNum,
      unit_number: unitNum,
      accuracy_percentage: accuracy,
      is_completed: isCompleted,
      learned_words_count: learnedCount
    });
    setUnitProgressList(updated);
    localStorage.setItem('lexis_progress', JSON.stringify(updated));

    // Award XP
    const newXp = xp + earnedXpForSession;
    setXp(newXp);
    localStorage.setItem('lexis_xp', newXp.toString());

    // Record study activity to lock streak for today ONLY if at least 1 word completed all 5 phases
    let activeStreak = streak;
    if (hasCompletedFullWord) {
      const studyRes = await recordStudyActivity(userProfile, streak);
      if (studyRes.profile) {
        setUserProfile(studyRes.profile);
      }
      activeStreak = studyRes.streak;
      setStreak(studyRes.streak);
    }

    if (userProfile) {
      try {
        await supabase.from('user_unit_progress').upsert({
          user_id: userProfile.id,
          book_number: bookNum,
          unit_number: unitNum,
          accuracy_percentage: accuracy,
          is_completed: isCompleted
        });

        const updatePayload: Record<string, any> = {
          total_xp: newXp
        };
        if (hasCompletedFullWord) {
          const nowIso = new Date().toISOString();
          updatePayload.streak_days = activeStreak;
          updatePayload.last_study_date = nowIso;
        }

        await supabase.from('profiles').update(updatePayload).eq('id', userProfile.id);
      } catch (err) {
        console.error('Failed to sync to Supabase:', err);
      }
    }
  };

  const getUnitCompletionCount = (bookNumber: number) => {
    return unitProgressList.filter(p => p.book_number === bookNumber && p.is_completed).length;
  };

  // Auto-populate words if user navigated directly to learning mode via URL
  useEffect(() => {
    if (currentView === 'learning' && selectedWords.length === 0) {
      const unitWords = allWords.filter(
        (w) => w.book_number === selectedBook && w.unit_number === selectedUnit
      );
      if (unitWords.length > 0) {
        setSelectedWords(unitWords);
      }
    }
  }, [currentView, selectedBook, selectedUnit, allWords, selectedWords.length]);

  // Navigation handlers with clean URLs & Middleware
  const handleSelectBook = (bookNumber: number) => {
    navigate(routes.book(bookNumber));
  };

  const handleSelectUnit = (unitNumber: number) => {
    navigate(routes.unit(selectedBook, unitNumber));
  };

  const handleStartLearning = (wordsToLearn: Word[]) => {
    // Auth Guard: If guest user, redirect to login while preserving return route & selected words
    if (!userProfile) {
      const returnUrl = routes.unit(selectedBook, selectedUnit);
      localStorage.setItem('lexis_auth_redirect_url', returnUrl);
      localStorage.setItem(
        `lexis_selected_words_${selectedBook}_${selectedUnit}`,
        JSON.stringify(wordsToLearn.map((w) => w.id))
      );
      setSelectedWords(wordsToLearn);
      navigate(routes.login());
      return;
    }

    setIsMistakesSession(false);
    setSelectedWords(wordsToLearn);
    setSessionEarnedXp(0);
    setSessionFailedWordIds(new Set());
    const initialPoints: Record<string, number> = {};
    wordsToLearn.forEach((w) => {
      initialPoints[w.id] = 0;
    });
    setSessionWordPoints(initialPoints);
    setLearningPhase(1);
    navigate(routes.learn(selectedBook, selectedUnit));
  };

  const handleStartMistakesLearning = (wordsToLearn: Word[]) => {
    if (!userProfile) {
      localStorage.setItem('lexis_auth_redirect_url', routes.mistakes());
      localStorage.setItem(
        'lexis_pending_selected_words',
        JSON.stringify(wordsToLearn.map((w) => w.id))
      );
      setSelectedWords(wordsToLearn);
      navigate(routes.login());
      return;
    }

    setIsMistakesSession(true);
    setSelectedWords(wordsToLearn);
    setSessionEarnedXp(0);
    setSessionFailedWordIds(new Set());
    const initialPoints: Record<string, number> = {};
    wordsToLearn.forEach((w) => {
      initialPoints[w.id] = 0;
    });
    setSessionWordPoints(initialPoints);
    setLearningPhase(1);
    scrollToTop();
    const bNum = wordsToLearn[0]?.book_number || selectedBook;
    const uNum = wordsToLearn[0]?.unit_number || selectedUnit;
    navigate(routes.learn(bNum, uNum));
  };

  const handleBack = () => {
    stopAudio();
    scrollToTop();
    if (currentView === 'learning') {
      if (isMistakesSession) {
        navigate(routes.mistakes());
      } else {
        navigate(routes.unit(selectedBook, selectedUnit));
      }
    } else if (currentView === 'words') {
      navigate(routes.book(selectedBook));
    } else if (currentView === 'units') {
      navigate(routes.catalog());
    } else if (currentView === 'mistakes') {
      navigate(routes.catalog());
    } else if (currentView === 'leaderboard') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        navigate(routes.catalog());
      }
    } else {
      navigate(routes.catalog());
    }
  };

  const navigateToLogin = () => navigate(routes.login());
  const navigateToProfile = () => navigate(routes.profile());
  const navigateToHome = () => navigate(routes.catalog());
  const navigateToLeaderboard = () => navigate(routes.leaderboard());
  const navigateToSettings = () => navigate(routes.settings());

  const handleSignOut = async () => {
    clearSession();
    setUserProfile(null);
    navigate(routes.catalog());
  };

  const handleAuthSuccess = async (profile: UserProfile) => {
    const streakRes = await checkAndUpdateStreak(profile, streak);
    const finalProfile = streakRes.profile || profile;

    saveSession(finalProfile);
    setUserProfile(finalProfile);
    setIsAuthOpen(false);

    // Return to previous location if user was redirected from unauthenticated study attempt
    const returnUrl = localStorage.getItem('lexis_auth_redirect_url');
    if (returnUrl) {
      localStorage.removeItem('lexis_auth_redirect_url');
      navigate(returnUrl);
    } else {
      navigateToHome();
    }

    if (typeof finalProfile.total_xp === 'number') {
      setXp(finalProfile.total_xp);
    }
    setStreak(streakRes.streak);

    try {
      const { data } = await supabase
        .from('user_unit_progress')
        .select('*')
        .eq('user_id', profile.id);
      if (data && data.length > 0) {
        setUnitProgressList(data);
        localStorage.setItem('lexis_progress', JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Could not load unit progress from Supabase:', e);
    }
  };

  const currentUnitWords = allWords.filter(
    (w) => w.book_number === selectedBook && w.unit_number === selectedUnit
  );

  // Dedicated Full-page Admin View (/admin-uchun)
  if (currentView === 'admin') {
    return (
      <AdminPage
        onGoHome={navigateToHome}
        isDark={isDark}
        onToggleTheme={() => handleSetThemeMode(isDark ? 'light' : 'dark')}
      />
    );
  }

  // Dedicated Full-page Login View (42.uz style)
  if (currentView === 'login') {
    return (
      <div className={`${isDark ? 'dark' : ''} min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors pb-20 sm:pb-0`}>
        <LoginPage
          onSuccess={handleAuthSuccess}
          onGoHome={navigateToHome}
          onOpenLeaderboard={navigateToLeaderboard}
        />
        <MobileBottomNav
          currentView={currentView}
          onGoHome={navigateToHome}
          onOpenSettings={navigateToSettings}
          onOpenLeaderboard={navigateToLeaderboard}
          mistakeCount={mistakeCount}
          onOpenMistakes={() => navigate(routes.mistakes())}
          userProfile={userProfile}
          onOpenProfile={navigateToProfile}
          onOpenAuth={navigateToLogin}
        />
      </div>
    );
  }

  // Dedicated Full-page User Profile View
  if (currentView === 'profile') {
    if (!userProfile) {
      navigateToLogin();
      return null;
    }
    return (
      <div className={`${isDark ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors pb-20 sm:pb-0`}>
        <ProfilePage
          userProfile={userProfile}
          unitProgressList={unitProgressList}
          books={books}
          onGoHome={navigateToHome}
          onOpenLeaderboard={navigateToLeaderboard}
          onSignOut={() => {
            handleSignOut();
            navigateToHome();
          }}
          onUpdateProfile={(updated) => {
            setUserProfile(updated);
            saveSession(updated);
          }}
          themeMode={themeMode}
          onSetThemeMode={handleSetThemeMode}
          isDark={isDark}
          onOpenSettings={navigateToSettings}
        />
        <MobileBottomNav
          currentView={currentView}
          onGoHome={navigateToHome}
          onOpenSettings={navigateToSettings}
          onOpenLeaderboard={navigateToLeaderboard}
          mistakeCount={mistakeCount}
          onOpenMistakes={() => navigate(routes.mistakes())}
          userProfile={userProfile}
          onOpenProfile={navigateToProfile}
          onOpenAuth={navigateToLogin}
        />
      </div>
    );
  }

  // Dedicated Full-page Settings View
  if (currentView === 'settings') {
    return (
      <div className={`${isDark ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors pb-20 sm:pb-0`}>
        <SettingsPage
          themeMode={themeMode}
          onSetThemeMode={handleSetThemeMode}
          isDark={isDark}
          userProfile={userProfile}
          onGoHome={navigateToHome}
          onGoBack={handleBack}
        />
        <MobileBottomNav
          currentView={currentView}
          onGoHome={navigateToHome}
          onOpenSettings={navigateToSettings}
          onOpenLeaderboard={navigateToLeaderboard}
          mistakeCount={mistakeCount}
          onOpenMistakes={() => navigate(routes.mistakes())}
          userProfile={userProfile}
          onOpenProfile={navigateToProfile}
          onOpenAuth={navigateToLogin}
        />
      </div>
    );
  }

  // Dedicated Full-page Leaderboard View
  if (currentView === 'leaderboard') {
    return (
      <div className={`${isDark ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors pb-20 sm:pb-0`}>
        <LeaderboardPage
          currentUser={userProfile}
          onGoHome={navigateToHome}
          onGoBack={handleBack}
          onOpenAuth={navigateToLogin}
        />
        <MobileBottomNav
          currentView={currentView}
          onGoHome={navigateToHome}
          onOpenSettings={navigateToSettings}
          onOpenLeaderboard={navigateToLeaderboard}
          mistakeCount={mistakeCount}
          onOpenMistakes={() => navigate(routes.mistakes())}
          userProfile={userProfile}
          onOpenProfile={navigateToProfile}
          onOpenAuth={navigateToLogin}
        />
      </div>
    );
  }

  // Dedicated Full-page Mistakes View
  if (currentView === 'mistakes') {
    return (
      <div className={`${isDark ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors pb-20 sm:pb-0`}>
        <MistakesPage
          onStartLearning={handleStartMistakesLearning}
          onGoHome={navigateToHome}
          onGoBack={handleBack}
          userProfile={userProfile}
          onOpenAuth={navigateToLogin}
          onOpenProfile={navigateToProfile}
          onOpenLeaderboard={navigateToLeaderboard}
        />
        <MobileBottomNav
          currentView={currentView}
          onGoHome={navigateToHome}
          onOpenSettings={navigateToSettings}
          onOpenLeaderboard={navigateToLeaderboard}
          mistakeCount={mistakeCount}
          onOpenMistakes={() => navigate(routes.mistakes())}
          userProfile={userProfile}
          onOpenProfile={navigateToProfile}
          onOpenAuth={navigateToLogin}
        />
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-x-clip transition-colors`}>
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onBack={handleBack}
        onGoHome={navigateToHome}
        userProfile={userProfile}
        onOpenAuth={navigateToLogin}
        onOpenProfile={navigateToProfile}
        onOpenLeaderboard={navigateToLeaderboard}
        mistakeCount={mistakeCount}
        onOpenMistakes={() => navigate(routes.mistakes())}
        xp={xp}
        streak={streak}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Views */}
      <main className="flex-1 pt-14 sm:pt-16 pb-24 sm:pb-12">
        {/* Sticky Back Button Bar (Stays pinned in place below Navbar when page scrolls) */}
        {currentView !== 'catalog' && (
          <div className="sticky top-14 sm:top-16 z-30 bg-slate-50 dark:bg-slate-950 py-2.5 transition-colors">
            <div className="max-w-6xl mx-auto px-3.5 sm:px-6 flex items-center justify-between">
              <button
                onClick={handleBack}
                aria-label="Orqaga qaytish"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer group active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Orqaga</span>
              </button>
            </div>
          </div>
        )}

        {/* 1. Catalog View (6 Books) */}
        {currentView === 'catalog' && (
          <BookCatalog
            books={books}
            onSelectBook={handleSelectBook}
            getUnitCompletionCount={getUnitCompletionCount}
          />
        )}

        {/* 2. Unit Selector View (1..30 Units) */}
        {currentView === 'units' && (
          <UnitSelector
            bookNumber={selectedBook}
            onSelectUnit={handleSelectUnit}
            unitProgressList={unitProgressList}
          />
        )}

        {/* 3. Word Selector View */}
        {currentView === 'words' && (
          <WordSelector
            bookNumber={selectedBook}
            unitNumber={selectedUnit}
            words={currentUnitWords.length > 0 ? currentUnitWords : allWords.slice(0, 20)}
            learnedWordIds={learnedWordIds}
            onStartLearning={handleStartLearning}
          />
        )}

        {/* 4. 5-Phase Cognitive Learning Engine */}
        {currentView === 'learning' && (
          <div className="py-2">
            {learningPhase === 1 && (
              <Phase1Flashcard
                words={selectedWords}
                onFinishPhase={() => {
                  setSessionWordPoints((prev) => {
                    const next = { ...prev };
                    selectedWords.forEach((w) => {
                      next[w.id] = 1;
                    });
                    return next;
                  });
                  setLearningPhase(2);
                }}
              />
            )}

            {learningPhase === 2 && (
              <Phase2Spelling
                words={selectedWords}
                onCompletePhase={(_earned, passedIds, failedIds) => {
                  if (failedIds && failedIds.length > 0) {
                    setSessionFailedWordIds((prev) => {
                      const next = new Set(prev);
                      failedIds.forEach((id) => next.add(id));
                      return next;
                    });
                  }
                  const passedSet = new Set(passedIds || []);
                  setSessionWordPoints((prev) => {
                    const next = { ...prev };
                    selectedWords.forEach((w) => {
                      if (passedSet.has(w.id)) {
                        next[w.id] = (next[w.id] || 0) + 1;
                      }
                    });
                    return next;
                  });
                  setLearningPhase(3);
                }}
              />
            )}

            {learningPhase === 3 && (
              <Phase3Quiz
                words={selectedWords}
                allWords={allWords}
                onCompletePhase={(_earned, passedIds, failedIds) => {
                  if (failedIds && failedIds.length > 0) {
                    setSessionFailedWordIds((prev) => {
                      const next = new Set(prev);
                      failedIds.forEach((id) => next.add(id));
                      return next;
                    });
                  }
                  const passedSet = new Set(passedIds || []);
                  setSessionWordPoints((prev) => {
                    const next = { ...prev };
                    selectedWords.forEach((w) => {
                      if (passedSet.has(w.id)) {
                        next[w.id] = (next[w.id] || 0) + 1;
                      }
                    });
                    return next;
                  });
                  setLearningPhase(4);
                }}
              />
            )}

            {learningPhase === 4 && (
              <Phase4Voice
                words={selectedWords}
                onCompletePhase={(_earned, passedIds, failedIds) => {
                  if (failedIds && failedIds.length > 0) {
                    setSessionFailedWordIds((prev) => {
                      const next = new Set(prev);
                      failedIds.forEach((id) => next.add(id));
                      return next;
                    });
                  }
                  const passedSet = new Set(passedIds || []);
                  setSessionWordPoints((prev) => {
                    const next = { ...prev };
                    selectedWords.forEach((w) => {
                      if (passedSet.has(w.id)) {
                        next[w.id] = (next[w.id] || 0) + 1;
                      }
                    });
                    return next;
                  });
                  setLearningPhase(5);
                }}
              />
            )}

            {learningPhase === 5 && (
              <Phase5Visual
                words={selectedWords}
                allWords={allWords}
                onCompletePhase={(_earned, passedIds, failedIds) => {
                  const finalFailed = new Set(sessionFailedWordIds);
                  if (failedIds && failedIds.length > 0) {
                    failedIds.forEach((id) => finalFailed.add(id));
                    setSessionFailedWordIds(finalFailed);
                  }

                  const passedSet = new Set(passedIds || []);
                  const finalWordPoints: Record<string, number> = { ...sessionWordPoints };
                  selectedWords.forEach((w) => {
                    if (passedSet.has(w.id)) {
                      finalWordPoints[w.id] = (finalWordPoints[w.id] || 0) + 1;
                    }
                  });
                  setSessionWordPoints(finalWordPoints);

                  // Update persistent wordPhaseScores
                  const updatedWordScores: Record<string, number> = { ...wordPhaseScores };
                  selectedWords.forEach((w) => {
                    const pts = finalWordPoints[w.id] || 0;
                    updatedWordScores[w.id] = Math.max(updatedWordScores[w.id] || 0, pts);
                  });
                  setWordPhaseScores(updatedWordScores);
                  try {
                    localStorage.setItem('lexis_word_phase_scores', JSON.stringify(updatedWordScores));
                  } catch (e) {
                    console.error('Failed to save wordPhaseScores:', e);
                  }

                  // 1. Perfectly completed words across all 5 phases (without 2-mistake failure)
                  const perfectWords = selectedWords.filter((w) => !finalFailed.has(w.id));
                  // Rule: exactly 1 XP per fully and perfectly completed word
                  const earnedXp = perfectWords.length;
                  setSessionEarnedXp(earnedXp);

                  // 2. Remove perfected words from Mistakes section
                  perfectWords.forEach((w) => {
                    removeMistake(w.id);
                  });

                  // 3. Update learnedWordIds: marked learned only when fully and perfectly completed
                  const nextLearnedWordIds = new Set(learnedWordIds);
                  perfectWords.forEach((w) => {
                    nextLearnedWordIds.add(w.id);
                  });
                  setLearnedWordIds(nextLearnedWordIds);
                  try {
                    localStorage.setItem(
                      'lexis_learned_word_ids',
                      JSON.stringify(Array.from(nextLearnedWordIds))
                    );
                  } catch (e) {
                    console.error('Failed to save learnedWordIds:', e);
                  }

                  // 4. Calculate Unit Progress: 5% per word (1 word = 5%, 20 words = 100%)
                  const unitWords = currentUnitWords.length > 0 ? currentUnitWords : selectedWords;
                  const totalWords = unitWords.length > 0 ? unitWords.length : 20;
                  const unitLearnedCount = unitWords.filter((w) => nextLearnedWordIds.has(w.id)).length;
                  const accuracy = Math.min(100, Math.round((unitLearnedCount / totalWords) * 100));
                  const isCompleted = accuracy >= 100;

                  // 5. Daily Streak: at least 1 word completed all 5 phases
                  const hasCompletedFullWord = perfectWords.length > 0;

                  saveUnitProgress(
                    selectedBook,
                    selectedUnit,
                    accuracy,
                    isCompleted,
                    unitLearnedCount,
                    earnedXp,
                    hasCompletedFullWord
                  );
                  setLearningPhase(6);
                }}
              />
            )}

            {learningPhase === 6 && (() => {
              const unitWords = currentUnitWords.length > 0 ? currentUnitWords : selectedWords;
              const totalWords = unitWords.length > 0 ? unitWords.length : 20;
              const unitLearnedCount = unitWords.filter((w) => learnedWordIds.has(w.id)).length;
              const unitAccuracy = Math.min(100, Math.round((unitLearnedCount / totalWords) * 100));
              const isUnitCompleted = unitAccuracy >= 100;

              const maxSessionXp = selectedWords.length;
              const sessionAccuracy = maxSessionXp > 0 ? Math.round((sessionEarnedXp / maxSessionXp) * 100) : 100;

              return (
                <Phase6Summary
                  words={selectedWords}
                  bookNumber={selectedBook}
                  unitNumber={selectedUnit}
                  earnedXp={sessionEarnedXp}
                  sessionAccuracy={sessionAccuracy}
                  unitAccuracy={unitAccuracy}
                  unitLearnedCount={unitLearnedCount}
                  isUnitCompleted={isUnitCompleted}
                  onNextUnit={() => {
                    if (isMistakesSession) {
                      navigate(routes.mistakes());
                    } else if (selectedUnit < 30) {
                      navigate(routes.unit(selectedBook, selectedUnit + 1));
                    } else {
                      navigate(routes.catalog());
                    }
                  }}
                  onContinueUnit={() => {
                    if (isMistakesSession) {
                      navigate(routes.mistakes());
                    } else {
                      navigate(routes.unit(selectedBook, selectedUnit));
                    }
                  }}
                  onRestart={() => {
                    setSessionEarnedXp(0);
                    setSessionFailedWordIds(new Set());
                    const initialPoints: Record<string, number> = {};
                    selectedWords.forEach((w) => {
                      initialPoints[w.id] = 0;
                    });
                    setSessionWordPoints(initialPoints);
                    setLearningPhase(1);
                  }}
                  onGoHome={() => {
                    navigate(routes.catalog());
                  }}
                />
              );
            })()}
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      {(currentView !== 'learning' || learningPhase === 6) && (
        <footer className="w-full py-5 text-center border-t border-slate-200/70 dark:border-slate-800/70 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <p className="flex items-center justify-center gap-1">
            <span>made by</span>
            <a
              href="https://t.me/alem_42"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2"
            >
              alem
            </a>
          </p>
        </footer>
      )}

      {/* Mobile Bottom Navigation Bar (Apple frosted glass effect, only when not in active learning) */}
      {currentView !== 'learning' && (
        <MobileBottomNav
          currentView={currentView}
          onGoHome={navigateToHome}
          onOpenSettings={navigateToSettings}
          onOpenLeaderboard={navigateToLeaderboard}
          mistakeCount={mistakeCount}
          onOpenMistakes={() => navigate(routes.mistakes())}
          userProfile={userProfile}
          onOpenProfile={navigateToProfile}
          onOpenAuth={navigateToLogin}
        />
      )}

      {/* Telegram Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
