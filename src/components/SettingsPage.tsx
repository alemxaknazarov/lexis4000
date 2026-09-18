import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Settings, Monitor, Sun, Moon, Volume2, 
  Check, Trash2, Zap, Database, VolumeX, ShieldCheck,
  Target
} from 'lucide-react';
import type { ThemeMode } from '../App';
import { supabase, type UserProfile } from '../lib/supabase';
import { speakWord } from '../utils/speech';
import { sounds } from '../utils/soundEffects';

interface SettingsPageProps {
  themeMode: ThemeMode;
  onSetThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  userProfile: UserProfile | null;
  onGoHome: () => void;
  onGoBack: () => void;
}

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({
  themeMode,
  onSetThemeMode,
  isDark,
  userProfile,
  onGoHome,
  onGoBack
}) => {
  // Speech Rate State ('0.8' | '1.0' | '1.2')
  const [speechRate, setSpeechRate] = useState<string>(() => {
    if (typeof window === 'undefined') return '1.0';
    return localStorage.getItem('lexis_speech_rate') || '1.0';
  });

  // Sound FX State
  const [soundFx, setSoundFx] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('lexis_sound_fx') !== 'false';
  });

  // Auto-speak State
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('lexis_auto_speak') !== 'false';
  });

  // Daily XP Goal State ('10' | '20' | '40')
  const [dailyGoal, setDailyGoal] = useState<string>(() => {
    if (typeof window === 'undefined') return '20';
    return localStorage.getItem('lexis_daily_goal') || '20';
  });

  // Cache cleared indicator
  const [cacheCleared, setCacheCleared] = useState(false);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Sync goal from Telegram Bot anchor if available
  useEffect(() => {
    const syncSettingsFromBot = async () => {
      if (!userProfile?.telegram_id) return;
      try {
        const { data } = await supabase
          .from('telegram_auth_codes')
          .select('last_name')
          .eq('telegram_id', userProfile.telegram_id)
          .like('last_name', '%|goal:%')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.last_name) {
          const match = data.last_name.match(/\|goal:(ielts|cefr)_([^_]+)_(\d+)/);
          if (match && match[3]) {
            setDailyGoal(match[3]);
            localStorage.setItem('lexis_daily_goal', match[3]);
          }
        }
      } catch (err) {
        console.warn('Failed to sync settings from bot:', err);
      }
    };
    syncSettingsFromBot();
  }, [userProfile?.telegram_id]);

  const handleSelectTheme = (mode: ThemeMode) => {
    sounds.playClick();
    onSetThemeMode(mode);
  };

  const handleSetSpeechRate = (rate: string) => {
    sounds.playClick();
    setSpeechRate(rate);
    localStorage.setItem('lexis_speech_rate', rate);
  };

  const handleToggleSoundFx = (enabled: boolean) => {
    setSoundFx(enabled);
    localStorage.setItem('lexis_sound_fx', String(enabled));
    if (enabled) {
      sounds.playClick();
    }
  };

  const handleToggleAutoSpeak = (enabled: boolean) => {
    sounds.playClick();
    setAutoSpeak(enabled);
    localStorage.setItem('lexis_auto_speak', String(enabled));
  };

  const handleSetDailyGoal = async (goal: string) => {
    sounds.playClick();
    setDailyGoal(goal);
    localStorage.setItem('lexis_daily_goal', goal);

    if (userProfile?.telegram_id) {
      try {
        const track = localStorage.getItem('lexis_learning_track') || 'cefr';
        const target = localStorage.getItem('lexis_target_level') || (track === 'ielts' ? '7.0' : 'B2');
        await supabase.from('telegram_auth_codes').insert({
          telegram_id: userProfile.telegram_id,
          code: '000000',
          first_name: userProfile.full_name || '',
          last_name: `anchor|goal:${track}_${target}_${goal}`,
          used: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
      } catch (e) {
        console.warn('Daily goal sync error:', e);
      }
    }
  };

  const handleTestAudio = () => {
    sounds.playClick();
    setIsPlayingTest(true);
    speakWord('Lexis 4000. Master English vocabulary effortlessly.').finally(() => {
      setIsPlayingTest(false);
    });
  };

  const handleClearCache = async () => {
    sounds.playClick();
    try {
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((k) => window.caches.delete(k)));
      }
    } catch (_) {}
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors selection:bg-emerald-500/20">
      {/* 1. Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-3xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
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

          {/* Right Action: Back Button */}
          <button
            onClick={onGoBack}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/90 dark:border-slate-800 transition cursor-pointer shrink-0 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Orqaga</span>
          </button>
        </div>
      </header>

      {/* 2. Main Settings Content */}
      <main className="flex-1 pt-18 sm:pt-22 pb-28 sm:pb-16 max-w-2xl w-full mx-auto px-3.5 sm:px-6 animate-fadeIn">
        {/* Compact Header */}
        <div className="mb-5 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold mb-1.5">
            <Settings className="w-3 h-3" />
            <span>Sozlamalar</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Ilova parametrlarini boshqarish
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            O‘zingizga moslashtiring: mavzu, ovoz tezligi va kunlik maqsad
          </p>
        </div>

        <div className="space-y-4">
          {/* Group 1: Ko'rinish & Mavzu (Theme) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Mavzu rejimi
                  </span>
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {themeMode === 'system' ? (isDark ? 'Tizim (Dark)' : 'Tizim (Light)') : themeMode === 'light' ? 'Light' : 'Dark'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Qurilma sozlamasiga moslashish yoki qat'iy rejim
                </p>
              </div>

              {/* Ultra-compact Segmented Pill */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800 text-xs shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSelectTheme('system')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    themeMode === 'system'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Tizim rejimiga moslashish"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>System</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme('light')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Yorug‘ rejim"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme('dark')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    themeMode === 'dark'
                      ? 'bg-white dark:bg-slate-800 text-indigo-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Qorong‘u rejim"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>

          {/* Group 2: Ovoz va Talaffuz (Sound & Speech) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3.5">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Ovoz va Talaffuz
              </h2>
            </div>

            {/* Row 1: Speech Rate */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Talaffuz tezligi
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Inglizcha so‘zlarning audio sur’ati
                </p>
              </div>

              {/* 3-way Speech Rate Segment */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800 text-xs shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSetSpeechRate('0.8')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    speechRate === '0.8'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  0.8x <span className="font-normal text-[10px] opacity-70">Sekin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetSpeechRate('1.0')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    speechRate === '1.0'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  1.0x <span className="font-normal text-[10px] opacity-70">Oddiy</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetSpeechRate('1.2')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    speechRate === '1.2'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  1.2x <span className="font-normal text-[10px] opacity-70">Tez</span>
                </button>
              </div>
            </div>

            {/* Row 2: Sound FX Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Tovush effektlari
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  To‘g‘ri va noto‘g‘ri javoblar signali hamda chertish ovozlari
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!soundFx && <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                <ToggleSwitch checked={soundFx} onChange={handleToggleSoundFx} />
              </div>
            </div>

            {/* Row 3: Auto-speak Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Avto-talaffuz
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Har bir yangi kartochka ochilganda so‘zni avtomatik o‘qish
                </p>
              </div>
              <ToggleSwitch checked={autoSpeak} onChange={handleToggleAutoSpeak} />
            </div>

            {/* Row 4: Test Audio Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Talaffuzni tekshirish
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tanlangan tezlik va ovoz sifatini sinab ko‘ring
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestAudio}
                disabled={isPlayingTest}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer active:scale-95 shadow-xs shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isPlayingTest ? 'O‘qilmoqda...' : 'Tinglash'}</span>
              </button>
            </div>
          </div>

          {/* Group 3: O'rganish Maqsadi (Daily XP Goal) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Kunlik maqsad (XP)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Kuniga kamida qancha tajriba bali to‘plashni rejalashtirasiz?
                </p>
              </div>

              {/* 3-way Daily Goal Segment (1 word = 1 XP) */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800 text-xs shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSetDailyGoal('10')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    dailyGoal === '10'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  10 XP <span className="font-normal text-[10px] opacity-70">10 so‘z</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDailyGoal('20')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    dailyGoal === '20'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  20 XP <span className="font-normal text-[10px] opacity-70">1 unit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDailyGoal('40')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    dailyGoal === '40'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  40 XP <span className="font-normal text-[10px] opacity-70">2 unit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Group 4: Xotira & Kesh (Data & Storage) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <Database className="w-3.5 h-3.5 text-sky-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Xotira va Ilova Ma’lumotlari
              </h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Kesh xotirasini tozalash
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Vaqtinchalik audio va brauzer ma’lumotlarini yangilash
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearCache}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shrink-0 ${
                  cacheCleared
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cacheCleared ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tozalandi!</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Tozalash</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">LEXIS 4000</span>
                <span>• Versiya 2.0</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Zap className="w-3 h-3" />
                <span>Offline Ready</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full py-4 sm:py-5 border-t border-slate-200/70 dark:border-slate-800/70 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
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
    </div>
  );
};
