import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Flame, BookOpen, Trophy, 
  CheckCircle2, Sparkles, LogOut, ShieldCheck, Phone, 
  Send, Target, Zap, Settings, X, Edit3, Share2, 
  GraduationCap, Check, BarChart2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile, UnitProgress, Book } from '../lib/supabase';
import type { ThemeMode } from '../App';
import { AvatarPickerModal } from './AvatarPickerModal';
import { sounds } from '../utils/soundEffects';

interface ProfilePageProps {
  userProfile: UserProfile;
  unitProgressList: UnitProgress[];
  books: Book[];
  onGoHome: () => void;
  onOpenLeaderboard: () => void;
  onSignOut: () => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  themeMode: ThemeMode;
  onSetThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  onOpenSettings?: () => void;
}

export type LearningTrack = 'cefr' | 'ielts';

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userProfile,
  unitProgressList,
  books,
  onGoHome,
  onOpenLeaderboard,
  onSignOut,
  onUpdateProfile,
  themeMode: _themeMode,
  onSetThemeMode: _onSetThemeMode,
  isDark: _isDark,
  onOpenSettings
}) => {
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loadingRank, setLoadingRank] = useState<boolean>(true);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Learning track & target preference
  const [learningTrack, setLearningTrack] = useState<LearningTrack>(() => {
    if (typeof window === 'undefined') return 'cefr';
    return (localStorage.getItem('lexis_learning_track') as LearningTrack) || 'cefr';
  });

  const [targetLevel, setTargetLevel] = useState<string>(() => {
    if (typeof window === 'undefined') return 'B2';
    return localStorage.getItem('lexis_target_level') || (learningTrack === 'ielts' ? '7.0' : 'B2');
  });

  const [userBio, setUserBio] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(`lexis_bio_${userProfile.id}`) || '';
  });

  // Edit form state
  const [editName, setEditName] = useState<string>(userProfile.full_name || '');
  const [editBio, setEditBio] = useState<string>(userBio);
  const [editTrack, setEditTrack] = useState<LearningTrack>(learningTrack);
  const [editTarget, setEditTarget] = useState<string>(targetLevel);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Sync edit fields when userProfile or modal changes
  useEffect(() => {
    setEditName(userProfile.full_name || '');
    setEditBio(userBio);
    setEditTrack(learningTrack);
    setEditTarget(targetLevel);
  }, [userProfile.full_name, userBio, learningTrack, targetLevel, isEditModalOpen]);

  // Scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Fetch user ranking
  useEffect(() => {
    const fetchRank = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, total_xp, telegram_id, last_study_date, created_at')
          .order('total_xp', { ascending: false })
          .order('last_study_date', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });

        if (!error && data) {
          const sorted = [...data].sort((a, b) => {
            if (b.total_xp !== a.total_xp) {
              return b.total_xp - a.total_xp;
            }
            const timeA = new Date(a.last_study_date || a.created_at || 0).getTime();
            const timeB = new Date(b.last_study_date || b.created_at || 0).getTime();
            return timeB - timeA;
          });

          const index = sorted.findIndex(
            (p) => p.id === userProfile.id || (userProfile.telegram_id && p.telegram_id === userProfile.telegram_id)
          );
          if (index !== -1) {
            setUserRank(index + 1);
          } else {
            setUserRank(sorted.length + 1);
          }
        }
      } catch (err) {
        console.error('Failed to fetch rank:', err);
      } finally {
        setLoadingRank(false);
      }
    };
    fetchRank();
  }, [userProfile]);

  const completedUnitsCount = unitProgressList.filter((p) => p.is_completed).length;
  const totalUnits = 180; // 6 books * 30 units
  const totalXp = userProfile.total_xp || 0;
  const streak = userProfile.streak_days || 0;
  const learnedWordsCount = completedUnitsCount * 20;

  // Accuracy calculation
  const accuracyPercentage = unitProgressList.length > 0
    ? Math.round(unitProgressList.reduce((sum, u) => sum + (u.accuracy_percentage || 92), 0) / unitProgressList.length)
    : 95;

  // Book-specific progress
  const getBookCompletedCount = (bookNumber: number) => {
    return unitProgressList.filter((p) => p.book_number === bookNumber && p.is_completed).length;
  };

  // Change Track handler
  const handleTrackChange = (track: LearningTrack) => {
    sounds.playClick();
    setLearningTrack(track);
    localStorage.setItem('lexis_learning_track', track);
    const defaultTarget = track === 'ielts' ? '7.0' : 'B2';
    setTargetLevel(defaultTarget);
    localStorage.setItem('lexis_target_level', defaultTarget);
  };

  // Avatar select
  const handleSelectAvatar = async (newUrl: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: newUrl })
        .eq('id', userProfile.id);

      if (!error) {
        onUpdateProfile({ ...userProfile, avatar_url: newUrl });
      }
    } catch (e) {
      console.error('Failed to save avatar:', e);
    }
  };

  // Save profile edits (Name, bio, track, target)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    sounds.playClick();
    setIsSavingProfile(true);

    try {
      const trimmedName = editName.trim();
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: trimmedName })
        .eq('id', userProfile.id);

      if (!error) {
        onUpdateProfile({ ...userProfile, full_name: trimmedName });
      }

      // Save local preferences
      setUserBio(editBio.trim());
      localStorage.setItem(`lexis_bio_${userProfile.id}`, editBio.trim());

      setLearningTrack(editTrack);
      localStorage.setItem('lexis_learning_track', editTrack);

      setTargetLevel(editTarget);
      localStorage.setItem('lexis_target_level', editTarget);

      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Share progress
  const handleShareProgress = () => {
    sounds.playClick();
    const trackLabel = learningTrack === 'ielts' ? `IELTS Band ${getEstimatedLevel().code}` : `CEFR ${getEstimatedLevel().code}`;
    const text = `🌟 Mening LEXIS 4000 dagi natijam:\n👤 ${userProfile.full_name}\n⚡️ ${totalXp} XP | 🔥 ${streak} kunlik streak\n🎯 Daraja: ${trackLabel}\n📚 ${learnedWordsCount} ta so‘z o‘rganildi!\n👉 https://lexis.uz`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  // CEFR & IELTS Level Estimations based on learned words (out of 4000)
  const getEstimatedLevel = () => {
    if (learningTrack === 'ielts') {
      if (learnedWordsCount >= 3000) return { code: '8.5 - 9.0', name: 'Expert / Native-like', color: 'text-purple-600 dark:text-purple-400', progress: Math.min(100, Math.round((learnedWordsCount / 4000) * 100)) };
      if (learnedWordsCount >= 2400) return { code: '7.5 - 8.0', name: 'Very Good User', color: 'text-indigo-600 dark:text-indigo-400', progress: Math.round((learnedWordsCount / 3000) * 100) };
      if (learnedWordsCount >= 1800) return { code: '6.5 - 7.0', name: 'Good User', color: 'text-emerald-600 dark:text-emerald-400', progress: Math.round((learnedWordsCount / 2400) * 100) };
      if (learnedWordsCount >= 1200) return { code: '5.5 - 6.0', name: 'Competent User', color: 'text-teal-600 dark:text-teal-400', progress: Math.round((learnedWordsCount / 1800) * 100) };
      if (learnedWordsCount >= 600) return { code: '4.5 - 5.0', name: 'Modest User', color: 'text-amber-600 dark:text-amber-400', progress: Math.round((learnedWordsCount / 1200) * 100) };
      return { code: '3.5 - 4.0', name: 'Foundation', color: 'text-slate-600 dark:text-slate-400', progress: Math.round((learnedWordsCount / 600) * 100) };
    } else {
      if (learnedWordsCount >= 3000) return { code: 'C1', name: 'Academic Proficiency', color: 'text-purple-600 dark:text-purple-400', progress: Math.min(100, Math.round((learnedWordsCount / 4000) * 100)) };
      if (learnedWordsCount >= 2400) return { code: 'B2+', name: 'Advanced Independent', color: 'text-indigo-600 dark:text-indigo-400', progress: Math.round((learnedWordsCount / 3000) * 100) };
      if (learnedWordsCount >= 1800) return { code: 'B2', name: 'Upper-Intermediate', color: 'text-emerald-600 dark:text-emerald-400', progress: Math.round((learnedWordsCount / 2400) * 100) };
      if (learnedWordsCount >= 1200) return { code: 'B1+', name: 'Intermediate', color: 'text-teal-600 dark:text-teal-400', progress: Math.round((learnedWordsCount / 1800) * 100) };
      if (learnedWordsCount >= 600) return { code: 'B1', name: 'Pre-Intermediate', color: 'text-amber-600 dark:text-amber-400', progress: Math.round((learnedWordsCount / 1200) * 100) };
      return { code: 'A1 - A2', name: 'Elementary', color: 'text-slate-600 dark:text-slate-400', progress: Math.round((learnedWordsCount / 600) * 100) };
    }
  };

  const estimated = getEstimatedLevel();

  // Book meta configurations based on track
  const bookMetaConfig = [
    { num: 1, cefr: 'A1 - A2', ielts: '3.5 - 4.5', desc: 'Boshlang‘ich leksika va kundalik iboralar' },
    { num: 2, cefr: 'B1', ielts: '4.5 - 5.5', desc: 'Pre-Intermediate so‘z boyligi va asoslar' },
    { num: 3, cefr: 'B1+', ielts: '5.5 - 6.5', desc: 'Kontekstual ifodalar va ravon so‘zlashuv' },
    { num: 4, cefr: 'B2', ielts: '6.5 - 7.5', desc: 'Upper-Intermediate va faol akademik so‘zlar' },
    { num: 5, cefr: 'B2+', ielts: '7.5 - 8.5', desc: 'Ilg‘or akademik va adabiy leksika' },
    { num: 6, cefr: 'C1', ielts: '8.5 - 9.0', desc: 'Mukammal daraja (IELTS Band 9 lug‘ati)' },
  ];

  // Achievements
  const achievements = [
    { id: 'first_step', title: 'Birinchi Qadam', desc: '1 ta unitni to‘liq o‘rganish', icon: '🚀', unlocked: completedUnitsCount >= 1 },
    { id: 'streak_3', title: 'Olovli Start', desc: '3 kun ketma-ket shug‘ullanish', icon: '🔥', unlocked: streak >= 3 },
    { id: 'xp_500', title: 'Bilimdon', desc: '500 XP to‘plash', icon: '⚡', unlocked: totalXp >= 500 },
    { id: 'book_1_master', title: 'Elementary Ustasi', desc: '1-kitobni to‘liq tugatish', icon: '👑', unlocked: getBookCompletedCount(1) >= 30 },
    { id: 'xp_1000', title: 'Leksika Elitasi', desc: '1000+ XP to‘plash', icon: '🌟', unlocked: totalXp >= 1000 },
    { id: 'super_master', title: '4000 Fotihi', desc: 'Barcha 6 ta kitobni zabt etish', icon: '🏆', unlocked: completedUnitsCount >= 180 }
  ];

  // Weekly days for activity chart
  const weekDays = [
    { label: 'Du', height: 40, active: false },
    { label: 'Se', height: 65, active: false },
    { label: 'Ch', height: 50, active: false },
    { label: 'Pa', height: 85, active: false },
    { label: 'Ju', height: 70, active: false },
    { label: 'Sha', height: 95, active: false },
    { label: 'Ya', height: 100, active: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors selection:bg-emerald-500/20">
      {/* 1. Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <div
            onClick={onGoHome}
            className="flex items-center cursor-pointer select-none py-1 shrink-0"
            title="Bosh sahifa"
          >
            <img
              src="/logo.png"
              alt="LEXIS 4000"
              className="h-7 sm:h-8.5 w-auto object-contain dark:hidden transition-transform hover:scale-105"
            />
            <img
              src="/logo-dark.png"
              alt="LEXIS 4000"
              className="h-7 sm:h-8.5 w-auto object-contain hidden dark:block transition-transform hover:scale-105"
            />
          </div>

          {/* Right Action: Share & Back */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareProgress}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 transition cursor-pointer shrink-0 active:scale-95"
              title="Natijani ulashish"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Nusxalandi!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Ulashish</span>
                </>
              )}
            </button>

            <button
              onClick={onGoHome}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/90 dark:border-slate-800 transition cursor-pointer shrink-0 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Orqaga</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 pt-18 sm:pt-22 pb-28 sm:pb-16 max-w-3xl w-full mx-auto px-3.5 sm:px-6 animate-fadeIn space-y-4">
        {/* User Identity Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Interactive Avatar */}
              <div 
                onClick={() => setIsAvatarPickerOpen(true)}
                className="relative group cursor-pointer select-none shrink-0"
                title="Avatarni o‘zgartirish uchun bosing"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-sm border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  {userProfile.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt={userProfile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userProfile.full_name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>

                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xs border border-white dark:border-slate-900 group-hover:bg-emerald-600 transition-colors">
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
              </div>

              {/* User Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                    {userProfile.full_name}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Tasdiqlangan</span>
                  </span>
                </div>

                {userBio ? (
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium italic truncate mb-1">
                    “{userBio}”
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                  {userProfile.username && (
                    <span className="flex items-center gap-1">
                      <Send className="w-3 h-3 text-sky-500" />
                      <span>@{userProfile.username}</span>
                    </span>
                  )}
                  {userProfile.phone_number && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-500" />
                      <span>{userProfile.phone_number}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions: Edit Name & Logout */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer active:scale-95"
              >
                <Edit3 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Tahrirlash</span>
              </button>

              <button
                onClick={onSignOut}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition cursor-pointer active:scale-95"
              >
                <LogOut className="w-3 h-3" />
                <span>Chiqish</span>
              </button>
            </div>
          </div>
        </div>

        {/* Learning Track & Target System Card (IELTS vs CEFR) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <div>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  O‘rganish Yo‘nalishi va Maqsad
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Kitoblar va natijalar qaysi tizimda hisoblansin?
              </p>
            </div>

            {/* Segmented CEFR vs IELTS Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800 text-xs shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleTrackChange('cefr')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  learningTrack === 'cefr'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>🎓 CEFR (A1-C1)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTrackChange('ielts')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  learningTrack === 'ielts'
                    ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>🎯 IELTS (Band 9)</span>
              </button>
            </div>
          </div>

          {/* Level Estimation Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Hozirgi leksik darajangiz:
                </span>
                <span className={`text-xs font-mono font-black ${estimated.color}`}>
                  {learningTrack === 'ielts' ? `Band ${estimated.code}` : estimated.code}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {estimated.name}
              </p>
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>{learnedWordsCount} / 4000 ta so‘z</span>
                  <span>{Math.round((learnedWordsCount / 4000) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((learnedWordsCount / 4000) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Belgilangan maqsad:
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {learningTrack === 'ielts' ? `IELTS ${targetLevel}` : `CEFR ${targetLevel}`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ushbu darajaga yetish uchun har kuni leksika ustida davomiy shug‘ullaning
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Holat:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {completedUnitsCount > 0 ? `${completedUnitsCount} / ${totalUnits} unit yakunlandi` : 'Boshlang‘ich bosqich'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Stats Grid (4 Metric Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* XP */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tajriba
              </span>
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalXp}
            </p>
            <span className="text-[10px] text-slate-400">Umumiy XP ball</span>
          </div>

          {/* Streak */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ketma-ketlik
              </span>
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {streak}
            </p>
            <span className="text-[10px] text-slate-400">Kun faollik</span>
          </div>

          {/* Accuracy */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Aniqlik
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {accuracyPercentage}%
            </p>
            <span className="text-[10px] text-slate-400">Mashqlar sifati</span>
          </div>

          {/* Global Rank */}
          <div 
            onClick={onOpenLeaderboard}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-xs cursor-pointer hover:border-purple-400/80 transition-colors"
            title="Reytingni ochish"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Reyting
              </span>
              <Trophy className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {loadingRank ? '-' : `#${userRank}`}
            </p>
            <span className="text-[10px] text-slate-400">O‘quvchilar ichida</span>
          </div>
        </div>

        {/* Weekly Activity & Daily Goal Tracker (Compact Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Weekly Activity Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Haftalik Faollik
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Oxirgi 7 kun</span>
            </div>

            <div className="flex items-end justify-between gap-1.5 h-16 pt-1">
              {weekDays.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div 
                    className={`w-full max-w-[18px] rounded-t-md transition-all ${
                      day.active 
                        ? 'bg-emerald-500 ring-2 ring-emerald-500/20' 
                        : 'bg-slate-200 dark:bg-slate-800 hover:bg-emerald-400/60'
                    }`}
                    style={{ height: `${day.height}%` }}
                  />
                  <span className={`text-[9px] font-semibold ${day.active ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Goal Quick Tracker */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Bugungi Maqsad
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Faol
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Har kuni leksika ustida muntazam shug‘ullanish orqali streakni saqlang
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Jami so‘zlar:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {learnedWordsCount} / 4000
              </span>
            </div>
          </div>
        </div>

        {/* Books Progress Matrix (6 Books according to track: CEFR or IELTS) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Kitoblar bo‘yicha taraqqiyot ({learningTrack.toUpperCase()})</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {learningTrack === 'ielts' ? 'IELTS ball darajalari asosida' : 'Xalqaro CEFR darajalari asosida'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {books.map((b) => {
              const completed = getBookCompletedCount(b.book_number);
              const percentage = Math.round((completed / 30) * 100);
              const meta = bookMetaConfig.find((m) => m.num === b.book_number) || bookMetaConfig[0];
              const badgeLabel = learningTrack === 'ielts' ? `IELTS ${meta.ielts}` : `CEFR ${meta.cefr}`;

              return (
                <div
                  key={b.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center">
                        {b.book_number}
                      </span>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {b.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      {badgeLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>{completed} / 30 unit</span>
                    <span className="font-mono font-semibold">{percentage}%</span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Yutuqlar va Nishonlar</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Darslarni bajarib erishilgan nishonlar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  ach.unlocked
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-800/40 opacity-40 grayscale'
                }`}
              >
                <div className="text-2xl mb-1">{ach.icon}</div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-0.5 truncate">
                  {ach.title}
                </h4>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {ach.desc}
                </p>
                {ach.unlocked && (
                  <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 bg-emerald-100/60 dark:bg-emerald-900/60 px-1 py-0.5 rounded">
                    <CheckCircle2 className="w-2 h-2" />
                    Ochildi
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Only: Settings Quick Button */}
        {onOpenSettings && (
          <div className="hidden sm:flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Ilova umumiy sozlamalari (Mavzu, ovoz va kesh)
              </span>
            </div>
            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Sozlamalar sahifasi
            </button>
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="w-full py-4 border-t border-slate-200/70 dark:border-slate-800/70 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
        <p>lexis.uz • 2026</p>
      </footer>

      {/* 3D Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        currentAvatarUrl={userProfile.avatar_url}
        onSelectAvatar={handleSelectAvatar}
      />

      {/* Edit Profile Modal (Name, Bio, Track, Target) */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Profilni Tahrirlash
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ism va Familiya
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ismingizni kiriting"
                  className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Bu ism reyting jadvalida ham barcha foydalanuvchilarga ko‘rinadi
                </p>
              </div>

              {/* Bio / Goal slogan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Shaxsiy shior yoki Maqsad (Bio)
                </label>
                <input
                  type="text"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="masalan: IELTS 7.5 olish yo‘lida 🎯"
                  maxLength={60}
                  className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              {/* Learning Track Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Asosiy tayyorgarlik standarti
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditTrack('cefr');
                      if (!['A2', 'B1', 'B1+', 'B2', 'B2+', 'C1'].includes(editTarget)) {
                        setEditTarget('B2');
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      editTrack === 'cefr'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🎓 CEFR (A1-C1)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditTrack('ielts');
                      if (!['5.5', '6.0', '6.5', '7.0', '7.5', '8.0+'].includes(editTarget)) {
                        setEditTarget('7.0');
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      editTrack === 'ielts'
                        ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🎯 IELTS (Band)
                  </button>
                </div>
              </div>

              {/* Target Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Maqsad daraja
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {editTrack === 'cefr' ? (
                    ['A2', 'B1', 'B1+', 'B2', 'B2+', 'C1'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setEditTarget(lvl)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          editTarget === lvl
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))
                  ) : (
                    ['5.5', '6.0', '6.5', '7.0', '7.5', '8.0+'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setEditTarget(lvl)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          editTarget === lvl
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer active:scale-95 shadow-xs"
                >
                  {isSavingProfile ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
