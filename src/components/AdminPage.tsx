import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  KeyRound,
  Shield,
  ShieldCheck,
  LogOut,
  Home,
  Search,
  Download,
  RefreshCw,
  Check,
  Copy,
  X,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Zap,
  Flame,
  Phone,
  AlertCircle,
  UserCheck,
  ChevronRight,
  Menu,
  Sun,
  Moon,
  TrendingUp,
  Award
} from 'lucide-react';
import { supabase, type UserProfile } from '../lib/supabase';
import { sounds } from '../utils/soundEffects';

interface AdminPageProps {
  onGoHome: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

interface UnitProgressRecord {
  id: number;
  user_id: string;
  book_number: number;
  unit_number: number;
  accuracy_percentage: number;
  is_completed: boolean;
  completed_at: string;
}

interface AuthCodeRecord {
  id: number;
  code: string;
  telegram_id: number;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

type AdminTab = 'dashboard' | 'users' | 'progress' | 'codes' | 'security';
type UserFilter = 'all' | 'has_phone' | 'active' | 'new';
type UserSort = 'created_desc' | 'xp_desc' | 'streak_desc' | 'name_asc';

// SHA-256 helper for password verification
async function hashPassword(pwd: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pwd.trim() + '_lexis_admin_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onGoHome,
  isDark,
  onToggleTheme
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('lexis_admin_auth') === 'true';
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab in Dashboard
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data States
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [unitProgress, setUnitProgress] = useState<UnitProgressRecord[]>([]);
  const [authCodes, setAuthCodes] = useState<AuthCodeRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Users Tab Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [userSort, setUserSort] = useState<UserSort>('created_desc');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Password Change State
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // 1. Fetch All Admin Data
  const fetchAdminData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch profiles
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profErr && profData) {
        setProfiles(profData as UserProfile[]);
      }

      // 2. Fetch unit progress
      const { data: progData } = await supabase
        .from('user_unit_progress')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(1000);

      if (progData) {
        setUnitProgress(progData as UnitProgressRecord[]);
      }

      // 3. Fetch auth codes
      const { data: codeData } = await supabase
        .from('telegram_auth_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (codeData) {
        setAuthCodes(codeData as AuthCodeRecord[]);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated]);

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    const user = usernameInput.trim().toLowerCase();
    const pwd = passwordInput.trim();

    if (!user || !pwd) {
      setLoginError('Login va parolni kiriting');
      setIsLoggingIn(false);
      return;
    }

    // Allowed admin usernames
    if (user !== 'admin' && user !== 'alem') {
      setLoginError('Bunday administrator topilmadi');
      setIsLoggingIn(false);
      return;
    }

    try {
      const storedHash = localStorage.getItem('lexis_admin_pwd_hash');
      const inputHash = await hashPassword(pwd);

      let isValid = false;
      if (storedHash) {
        isValid = storedHash === inputHash;
      } else {
        // Default passwords for first setup
        isValid = pwd === 'alem4000' || pwd === 'admin4000';
      }

      if (isValid) {
        sounds.playCorrect();
        sessionStorage.setItem('lexis_admin_auth', 'true');
        setIsAuthenticated(true);
      } else {
        sounds.playWrong();
        setLoginError('Parol noto‘g‘ri! Qayta urinib ko‘ring.');
      }
    } catch {
      setLoginError('Autentifikatsiyada xatolik yuz berdi');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    sounds.playClick();
    sessionStorage.removeItem('lexis_admin_auth');
    setIsAuthenticated(false);
    setUsernameInput('');
    setPasswordInput('');
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    setIsChangingPwd(true);

    try {
      const storedHash = localStorage.getItem('lexis_admin_pwd_hash');
      const currentInputHash = await hashPassword(currentPwd);

      let isCurrentValid = false;
      if (storedHash) {
        isCurrentValid = storedHash === currentInputHash;
      } else {
        isCurrentValid = currentPwd === 'alem4000' || currentPwd === 'admin4000';
      }

      if (!isCurrentValid) {
        setPwdMsg({ type: 'error', text: 'Amaldagi parol noto‘g‘ri kiritildi!' });
        setIsChangingPwd(false);
        return;
      }

      if (newPwd.length < 6) {
        setPwdMsg({ type: 'error', text: 'Yangi parol kamida 6 ta belgidan iborat bo‘lishi shart!' });
        setIsChangingPwd(false);
        return;
      }

      if (newPwd !== confirmPwd) {
        setPwdMsg({ type: 'error', text: 'Yangi parollar bir-biriga mos kelmadi!' });
        setIsChangingPwd(false);
        return;
      }

      const newHash = await hashPassword(newPwd);
      localStorage.setItem('lexis_admin_pwd_hash', newHash);

      sounds.playCorrect();
      setPwdMsg({ type: 'success', text: 'Parol muvaffaqiyatli o‘zgartirildi! Keyingi kirishda yangi paroldan foydalaning.' });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch {
      setPwdMsg({ type: 'error', text: 'Parolni o‘zgartirishda kutilmagan xatolik yuz berdi.' });
    } finally {
      setIsChangingPwd(false);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    sounds.playClick();
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Export Users to CSV
  const handleExportCSV = () => {
    sounds.playClick();
    if (profiles.length === 0) return;

    const headers = ['ID', 'Ism-Familiya', 'Username', 'Telefon', 'Telegram ID', 'Total XP', 'Streak (kun)', 'Oxirgi dars', 'Ro‘yxatdan o‘tgan'];
    const rows = profiles.map((p) => [
      p.id,
      `"${(p.full_name || '').replace(/"/g, '""')}"`,
      p.username ? `@${p.username}` : '',
      p.phone_number || '',
      p.telegram_id || '',
      p.total_xp || 0,
      p.streak_days || 0,
      p.last_study_date || '',
      p.created_at ? new Date(p.created_at).toLocaleString('uz-UZ') : ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lexis4000_foydalanuvchilar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Computed Metrics
  const metrics = useMemo(() => {
    const totalUsers = profiles.length;
    const usersWithPhone = profiles.filter((p) => Boolean(p.phone_number)).length;
    const totalXp = profiles.reduce((sum, p) => sum + (p.total_xp || 0), 0);
    const activeStreaks = profiles.filter((p) => (p.streak_days || 0) > 0).length;
    const totalCompletedUnits = unitProgress.filter((u) => u.is_completed).length;

    // Users registered in last 7 days
    const now = Date.now();
    const newUsersLast7Days = profiles.filter((p) => {
      if (!p.created_at) return false;
      const createdTime = new Date(p.created_at).getTime();
      return now - createdTime <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      totalUsers,
      usersWithPhone,
      totalXp,
      activeStreaks,
      totalCompletedUnits,
      newUsersLast7Days
    };
  }, [profiles, unitProgress]);

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    let list = [...profiles];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) =>
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.username || '').toLowerCase().includes(q) ||
        (p.phone_number || '').includes(q) ||
        String(p.telegram_id || '').includes(q)
      );
    }

    // Filter
    if (userFilter === 'has_phone') {
      list = list.filter((p) => Boolean(p.phone_number));
    } else if (userFilter === 'active') {
      list = list.filter((p) => (p.streak_days || 0) > 0 || (p.total_xp || 0) > 0);
    } else if (userFilter === 'new') {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((p) => p.created_at && new Date(p.created_at).getTime() >= sevenDaysAgo);
    }

    // Sort
    if (userSort === 'xp_desc') {
      list.sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0));
    } else if (userSort === 'streak_desc') {
      list.sort((a, b) => (b.streak_days || 0) - (a.streak_days || 0));
    } else if (userSort === 'name_asc') {
      list.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    } else {
      list.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      });
    }

    return list;
  }, [profiles, searchQuery, userFilter, userSort]);

  // ==========================================
  // VIEW 1: ADMIN LOGIN SCREEN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${isDark ? 'dark' : ''} bg-slate-950 flex flex-col justify-center items-center px-4 selection:bg-emerald-500/30`}>
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo & Security Tag */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <Lock className="w-2.5 h-2.5" />
              <span>Xavfsiz Boshqaruv Portali</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              LEXIS 4000 Admin
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Platforma administratori uchun yopiq kirish tizimi
            </p>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Admin Login
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Loginni kiriting"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Maxfiy Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Parolni kiriting"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl text-sm bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 transition cursor-pointer active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Boshqaruv paneliga kirish</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Action */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Sayt bosh sahifasiga qaytish</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED ADMIN DASHBOARD
  // ==========================================
  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors selection:bg-emerald-500/20`}>
      {/* 1. SIDEBAR (Desktop & Mobile Drawer) */}
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/90 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight block leading-tight">
                  LEXIS 4000
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                  Admin Panel
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('users');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Foydalanuvchilar</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold">
                {profiles.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('progress');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'progress'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Unitlar Faolligi</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('codes');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'codes'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4" />
                <span>Kirish Kodlari</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold">
                {authCodes.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('security');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Xavfsizlik & Parol</span>
            </button>
          </nav>
        </div>

        {/* Admin Card & Footer Actions */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          {/* Admin Identity Card */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                alem (Admin)
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                ● Tizim faol
              </p>
            </div>
          </div>

          <button
            onClick={onGoHome}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Saytga o‘tish</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200/60 dark:border-red-900/40 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white capitalize">
                {activeTab === 'dashboard' && 'Boshqaruv Paneli (Overview)'}
                {activeTab === 'users' && 'Foydalanuvchilar Bazasi'}
                {activeTab === 'progress' && 'Unitlar va O‘rganish Faolligi'}
                {activeTab === 'codes' && 'Telegram Kirish Kodlari Jurnali'}
                {activeTab === 'security' && 'Admin Xavfsizlik Sozlamalari'}
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                LEXIS 4000 platformasi boshqaruv markazi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Realtime Refresh Button */}
            <button
              onClick={fetchAdminData}
              disabled={loadingData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-50 active:scale-95"
              title="Ma’lumotlarni yangilash"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-emerald-500' : ''}`} />
              <span className="hidden sm:inline">Yangilash</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Tema"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* ==========================================
              TAB 1: OVERVIEW DASHBOARD
              ========================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Total Users */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Foydalanuvchilar
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {metrics.totalUsers}
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                    +{metrics.newUsersLast7Days} ta oxirgi 7 kunda
                  </p>
                </div>

                {/* 2. Users with Phone */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Telefon kiritganlar
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {metrics.usersWithPhone}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    {metrics.totalUsers > 0 ? `${Math.round((metrics.usersWithPhone / metrics.totalUsers) * 100)}% ulushi` : '0%'}
                  </p>
                </div>

                {/* 3. Total XP */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Umumiy XP
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {metrics.totalXp.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                    Platforma bo‘yicha to‘plangan
                  </p>
                </div>

                {/* 4. Active Streaks */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Faol Streaklar
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {metrics.activeStreaks}
                  </div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1">
                    Uzluksiz dars qilayotganlar
                  </p>
                </div>
              </div>

              {/* Two Column Layout: Recent Users & Top Leaders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent Users Box */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Eng so‘nggi ro‘yxatdan o‘tganlar
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Barchasi</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {profiles.slice(0, 5).map((user) => (
                      <div
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer border border-transparent hover:border-slate-200/70 dark:hover:border-slate-700/60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              user.full_name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {user.full_name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {user.username ? `@${user.username}` : user.phone_number || 'Tel yo‘q'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {user.total_xp || 0} XP
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('uz-UZ') : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top XP Leaders Box */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Yetakchi o‘quvchilar (Top XP)
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('users');
                        setUserSort('xp_desc');
                      }}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Barchasi</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {[...profiles]
                      .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
                      .slice(0, 5)
                      .map((user, idx) => (
                        <div
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer border border-transparent hover:border-slate-200/70 dark:hover:border-slate-700/60"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-6 text-center font-mono font-black text-xs ${
                              idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-500'
                            }`}>
                              #{idx + 1}
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                              ) : (
                                user.full_name?.charAt(0).toUpperCase() || 'U'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {user.full_name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                🔥 {user.streak_days || 0} kunlik streak
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                              ⚡️ {user.total_xp || 0} XP
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 2: USERS DATABASE TABLE
              ========================================== */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Action Toolbar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ism, @username, telefon yoki ID bo‘yicha qidirish..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Actions: Export CSV */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 transition cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV Yuklab olish</span>
                    </button>
                  </div>
                </div>

                {/* Filter Pills & Sorter */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setUserFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        userFilter === 'all'
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Barchasi ({profiles.length})
                    </button>

                    <button
                      onClick={() => setUserFilter('has_phone')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        userFilter === 'has_phone'
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      📱 Telefonlilari ({metrics.usersWithPhone})
                    </button>

                    <button
                      onClick={() => setUserFilter('active')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        userFilter === 'active'
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      🔥 Faollar ({metrics.activeStreaks})
                    </button>

                    <button
                      onClick={() => setUserFilter('new')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        userFilter === 'new'
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      ✨ Yangilar ({metrics.newUsersLast7Days})
                    </button>
                  </div>

                  {/* Sorter */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Saralash:</span>
                    <select
                      value={userSort}
                      onChange={(e) => setUserSort(e.target.value as UserSort)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none focus:outline-hidden cursor-pointer"
                    >
                      <option value="created_desc">Eng yangilar</option>
                      <option value="xp_desc">Eng ko‘p XP</option>
                      <option value="streak_desc">Eng katta Streak</option>
                      <option value="name_asc">Ism (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Data Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Foydalanuvchi</th>
                        <th className="py-3 px-4">Telegram & Username</th>
                        <th className="py-3 px-4">Telefon Raqami</th>
                        <th className="py-3 px-4 text-center">XP & Streak</th>
                        <th className="py-3 px-4">Oxirgi Dars</th>
                        <th className="py-3 px-4">Ro‘yxatdan o‘tgan</th>
                        <th className="py-3 px-4 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            Hech qanday foydalanuvchi topilmadi
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                          >
                            {/* User Avatar + Full Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                  {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                                  ) : (
                                    user.full_name?.charAt(0).toUpperCase() || 'U'
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-white truncate">
                                    {user.full_name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono truncate">
                                    ID: {user.id.substring(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Username & Telegram ID */}
                            <td className="py-3 px-4">
                              {user.username ? (
                                <a
                                  href={`https://t.me/${user.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400 hover:underline"
                                >
                                  <span>@{user.username}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                              {user.telegram_id && (
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  tg: {user.telegram_id}
                                </span>
                              )}
                            </td>

                            {/* Phone Number */}
                            <td className="py-3 px-4">
                              {user.phone_number ? (
                                <div className="flex items-center gap-1.5">
                                  <a
                                    href={`tel:${user.phone_number}`}
                                    className="font-mono font-semibold text-slate-800 dark:text-slate-200 hover:text-emerald-600 transition"
                                  >
                                    {user.phone_number}
                                  </a>
                                  <button
                                    onClick={() => handleCopy(user.phone_number || '')}
                                    className="p-1 text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                                    title="Nusxa olish"
                                  >
                                    {copiedText === user.phone_number ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Kiritilmagan</span>
                              )}
                            </td>

                            {/* XP & Streak */}
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                                ⚡️ {user.total_xp || 0}
                              </span>
                              {(user.streak_days || 0) > 0 && (
                                <span className="inline-flex items-center gap-0.5 ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                                  🔥 {user.streak_days}
                                </span>
                              )}
                            </td>

                            {/* Last Study */}
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                              {user.last_study_date || 'Yo‘q'}
                            </td>

                            {/* Created At */}
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString('uz-UZ') : '-'}
                            </td>

                            {/* Action: Detail Modal */}
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                              >
                                Batafsil
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-400 text-center">
                  Jami ko‘rsatilmoqda: <span className="font-bold text-slate-700 dark:text-slate-200">{filteredUsers.length}</span> / {profiles.length} ta foydalanuvchi
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: UNIT PROGRESS MONITORING
              ========================================== */}
          {activeTab === 'progress' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Kitoblar bo‘yicha o‘zlashtirish tahlili
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  Foydalanuvchilar qaysi kitoblarni ko‘proq tugatishayotganini kuzating
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((bookNum) => {
                    const bookUnits = unitProgress.filter((u) => u.book_number === bookNum && u.is_completed);
                    const avgAccuracy = bookUnits.length > 0
                      ? Math.round(bookUnits.reduce((s, u) => s + (u.accuracy_percentage || 0), 0) / bookUnits.length)
                      : 0;

                    return (
                      <div
                        key={bookNum}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {bookNum}-Kitob
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {bookUnits.length} marta tugatilgan
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>O‘rtacha aniqlik:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{avgAccuracy}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, (bookUnits.length / Math.max(1, unitProgress.length)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 4: TELEGRAM AUTH CODES LOG
              ========================================== */}
          {activeTab === 'codes' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Telegram Bot orqali berilgan kirish kodlari
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Foydalanuvchilar botdan olgan bir martalik 6 xonali tasdiqlash kodlari jurnali
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Oxirgi {authCodes.length} ta kod
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Kod</th>
                        <th className="py-3 px-4">Telegram ID</th>
                        <th className="py-3 px-4">Ism & Username</th>
                        <th className="py-3 px-4">Telefon</th>
                        <th className="py-3 px-4">Holati</th>
                        <th className="py-3 px-4">Berilgan vaqti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {authCodes.map((codeItem) => (
                        <tr key={codeItem.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition font-mono">
                          <td className="py-3 px-4">
                            <span className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {codeItem.code}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {codeItem.telegram_id}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              {codeItem.first_name || 'Noma‘lum'} {codeItem.last_name?.replace(/\|goal:.*/, '') || ''}
                            </span>
                            {codeItem.username && (
                              <span className="text-[10px] text-sky-500 font-mono">
                                @{codeItem.username}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {codeItem.phone_number || '-'}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            {codeItem.used ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                                <Check className="w-2.5 h-2.5" />
                                <span>Ishlatilgan</span>
                              </span>
                            ) : new Date(codeItem.expires_at).getTime() < Date.now() ? (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                Muddati tugagan
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                                Kutilmoqda
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-500">
                            {codeItem.created_at ? new Date(codeItem.created_at).toLocaleString('uz-UZ') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 5: SECURITY & CHANGE PASSWORD
              ========================================== */}
          {activeTab === 'security' && (
            <div className="max-w-xl space-y-6 animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="flex items-center gap-2.5 mb-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Admin Parolini O‘zgartirish
                    </h3>
                    <p className="text-xs text-slate-400">
                      Boshqaruv paneliga kirish uchun yangi xavfsiz parol o‘rnating
                    </p>
                  </div>
                </div>

                {pwdMsg && (
                  <div
                    className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                      pwdMsg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {pwdMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{pwdMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Amaldagi parol
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder="Hozirgi parolingizni kiriting"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Yangi parol (kamida 6 ta belgi)
                    </label>
                    <input
                      type="password"
                      required
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="Yangi kuchli parolni kiriting"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Yangi parolni takrorlang
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder="Yangi parolni tasdiqlang"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPwd}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      {isChangingPwd ? 'Yangilanmoqda...' : 'Yangi parolni saqlash'}
                    </button>
                  </div>
                </form>

                {/* Reset Option */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Haqiqatan ham parolni boshlang‘ich holatga qaytarmoqchimisiz?')) {
                        localStorage.removeItem('lexis_admin_pwd_hash');
                        setPwdMsg({ type: 'success', text: 'Parol muvaffaqiyatli boshlang‘ich holatga qaytarildi!' });
                      }
                    }}
                    className="text-[11px] text-slate-400 hover:text-red-500 transition cursor-pointer underline"
                  >
                    Parolni boshlang‘ich holatga qaytarish
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==========================================
          USER DETAIL MODAL
          ========================================== */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Foydalanuvchi Profili
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Identity Info */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  selectedUser.full_name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                  {selectedUser.full_name}
                </h4>
                <p className="text-xs text-slate-400 font-mono truncate">
                  ID: {selectedUser.id}
                </p>
                {selectedUser.telegram_id && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Telegram ID: {selectedUser.telegram_id}
                  </p>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-2.5 text-xs">
              {/* Phone */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 font-medium">Telefon raqam:</span>
                {selectedUser.phone_number ? (
                  <div className="flex items-center gap-2">
                    <a href={`tel:${selectedUser.phone_number}`} className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedUser.phone_number}
                    </a>
                    <button
                      onClick={() => handleCopy(selectedUser.phone_number || '')}
                      className="p-1 text-slate-400 hover:text-emerald-500 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400">Yo‘q</span>
                )}
              </div>

              {/* Username */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 font-medium">Telegram username:</span>
                {selectedUser.username ? (
                  <a
                    href={`https://t.me/${selectedUser.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <span>@{selectedUser.username}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">Yo‘q</span>
                )}
              </div>

              {/* XP and Streak */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-medium block">Jami XP:</span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                    ⚡️ {selectedUser.total_xp || 0} XP
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-medium block">Ketma-ketlik:</span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                    🔥 {selectedUser.streak_days || 0} kun
                  </span>
                </div>
              </div>

              {/* Completed Units */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 font-medium">Bajarilgan unitlar:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {unitProgress.filter((u) => u.user_id === selectedUser.id && u.is_completed).length} ta unit
                </span>
              </div>

              {/* Dates */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Oxirgi dars:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {selectedUser.last_study_date || 'Dars qilinmagan'}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Ro‘yxatdan o‘tgan:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('uz-UZ') : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
