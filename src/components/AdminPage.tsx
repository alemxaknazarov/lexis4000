import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  KeyRound,
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
  AlertTriangle,
  UserCheck,
  ChevronRight,
  Menu,
  Sun,
  Moon,
  TrendingUp,
  Award,
  Trash2,
  Loader2,
  Megaphone,
  Send,
  BookOpen,
  Edit3,
  Save,
  Volume2,
  User
} from 'lucide-react';
import { supabase, type UserProfile, type Word } from '../lib/supabase';
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

type AdminTab = 'dashboard' | 'users' | 'broadcast' | 'dictionary' | 'progress' | 'codes' | 'security';
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

  // User Deletion State (Requires Admin Password)
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('📢 LEXIS 4000 dan yangilik!');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastButtonText, setBroadcastButtonText] = useState('🌐 Saytga kirish');
  const [broadcastButtonUrl, setBroadcastButtonUrl] = useState('https://lexis4000.uz');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'test_alem' | 'active_streak' | 'single'>('test_alem');
  const [selectedTargetUser, setSelectedTargetUser] = useState<UserProfile | null>(null);
  const [broadcastUserSearch, setBroadcastUserSearch] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ ok: boolean; message: string; count?: number } | null>(null);

  // Direct Message Modal State (for 1-on-1 messaging)
  const [directMessageUser, setDirectMessageUser] = useState<UserProfile | null>(null);
  const [directMessageTitle, setDirectMessageTitle] = useState('');
  const [directMessageBody, setDirectMessageBody] = useState('');
  const [directMessageButtonText, setDirectMessageButtonText] = useState('🌐 Saytga kirish');
  const [directMessageButtonUrl, setDirectMessageButtonUrl] = useState('https://lexis4000.uz');
  const [directMessageCustomChatId, setDirectMessageCustomChatId] = useState('');
  const [isSendingDirectMessage, setIsSendingDirectMessage] = useState(false);
  const [directMessageResult, setDirectMessageResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Dictionary Tab State
  const [dictSearch, setDictSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<number>(1);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<number>(0);
  const [dictionaryWords, setDictionaryWords] = useState<Word[]>([]);
  const [dictVisibleCount, setDictVisibleCount] = useState<number>(60);
  const [loadingDictionary, setLoadingDictionary] = useState(false);
  const [playingWordAudio, setPlayingWordAudio] = useState<string | null>(null);

  // User Score (XP & Streak) Editing State
  const [isEditingScores, setIsEditingScores] = useState(false);
  const [editXpInput, setEditXpInput] = useState<number>(0);
  const [editStreakInput, setEditStreakInput] = useState<number>(0);
  const [isSavingScores, setIsSavingScores] = useState(false);

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

  // Handle User Deletion (Protected by Admin Password)
  const handleConfirmDeleteUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userToDelete) return;

    setDeleteError('');
    setIsDeletingUser(true);

    const pwd = deletePasswordInput.trim();
    if (!pwd) {
      setDeleteError('Iltimos, admin parolini kiriting');
      setIsDeletingUser(false);
      return;
    }

    try {
      // 1. Verify admin password
      const storedHash = localStorage.getItem('lexis_admin_pwd_hash');
      const inputHash = await hashPassword(pwd);

      let isValid = false;
      if (storedHash) {
        isValid = storedHash === inputHash;
      } else {
        isValid = pwd === 'alem4000' || pwd === 'admin4000';
      }

      if (!isValid) {
        sounds.playWrong();
        setDeleteError('Admin paroli noto‘g‘ri! O‘chirish rad etildi.');
        setIsDeletingUser(false);
        return;
      }

      // 2. Cascade delete from Supabase
      try {
        await supabase.from('user_unit_progress').delete().eq('user_id', userToDelete.id);
      } catch (unitErr) {
        console.warn('Unit progress delete error:', unitErr);
      }

      if (userToDelete.telegram_id) {
        try {
          await supabase.from('telegram_auth_codes').delete().eq('telegram_id', userToDelete.telegram_id);
        } catch (authErr) {
          console.warn('Telegram auth codes delete error:', authErr);
        }
      }

      const { error: deleteErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (deleteErr) {
        throw deleteErr;
      }

      // 3. Update local state
      sounds.playCorrect();
      const targetId = userToDelete.id;
      const targetName = userToDelete.full_name || 'Foydalanuvchi';

      setProfiles((prev) => prev.filter((p) => p.id !== targetId));
      setUnitProgress((prev) => prev.filter((u) => u.user_id !== targetId));

      if (selectedUser?.id === targetId) {
        setSelectedUser(null);
      }

      setUserToDelete(null);
      setDeletePasswordInput('');
      setShowDeletePassword(false);

      setDeleteToast(`"${targetName}" muvaffaqiyatli o‘chirildi`);
      setTimeout(() => setDeleteToast(null), 4000);
    } catch (err: any) {
      sounds.playWrong();
      setDeleteError(err?.message || 'Foydalanuvchini o‘chirishda xatolik yuz berdi');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Sync user scores when selectedUser is opened
  useEffect(() => {
    if (selectedUser) {
      setEditXpInput(selectedUser.total_xp || 0);
      setEditStreakInput(selectedUser.streak_days || 0);
      setIsEditingScores(false);
    }
  }, [selectedUser]);

  // Handle Save User Scores (XP & Streak)
  const handleSaveScores = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;
    setIsSavingScores(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          total_xp: Number(editXpInput),
          streak_days: Number(editStreakInput)
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      sounds.playCorrect();
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === selectedUser.id
            ? { ...p, total_xp: Number(editXpInput), streak_days: Number(editStreakInput) }
            : p
        )
      );
      setSelectedUser((prev) =>
        prev
          ? { ...prev, total_xp: Number(editXpInput), streak_days: Number(editStreakInput) }
          : null
      );
      setIsEditingScores(false);
      setDeleteToast(`"${selectedUser.full_name}" ko‘rsatkichlari muvaffaqiyatli saqlandi!`);
      setTimeout(() => setDeleteToast(null), 3500);
    } catch (err: any) {
      sounds.playWrong();
      alert('Xatolik: ' + (err.message || 'Saqlab bo‘lmadi'));
    } finally {
      setIsSavingScores(false);
    }
  };

  // Handle Load Dictionary Book
  const loadDictionaryBook = async (bookNum: number) => {
    setLoadingDictionary(true);
    setSelectedBook(bookNum);
    setSelectedUnitFilter(0);
    setDictVisibleCount(60);
    try {
      if (bookNum === 0) {
        // Load all 6 books concurrently
        const [m1, m2, m3, m4, m5, m6] = await Promise.all([
          import('../data/book1Words'),
          import('../data/book2Words'),
          import('../data/book3Words'),
          import('../data/book4Words'),
          import('../data/book5Words'),
          import('../data/book6Words')
        ]);
        const allWords = [
          ...(m1.BOOK_1_WORDS || []),
          ...(m2.BOOK_2_WORDS || []),
          ...(m3.BOOK_3_WORDS || []),
          ...(m4.BOOK_4_WORDS || []),
          ...(m5.BOOK_5_WORDS || []),
          ...(m6.BOOK_6_WORDS || [])
        ];
        setDictionaryWords(allWords);
      } else {
        let mod: any;
        if (bookNum === 1) mod = await import('../data/book1Words');
        else if (bookNum === 2) mod = await import('../data/book2Words');
        else if (bookNum === 3) mod = await import('../data/book3Words');
        else if (bookNum === 4) mod = await import('../data/book4Words');
        else if (bookNum === 5) mod = await import('../data/book5Words');
        else mod = await import('../data/book6Words');

        const wordsArray = mod[`BOOK_${bookNum}_WORDS`] || mod[`book${bookNum}Words`] || [];
        setDictionaryWords(wordsArray);
      }
    } catch (err) {
      console.error('Failed to load book words:', err);
    } finally {
      setLoadingDictionary(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dictionary' && dictionaryWords.length === 0) {
      loadDictionaryBook(1);
    }
  }, [activeTab]);

  // Handle Play Word Audio
  const handlePlayAudio = (url: string, word: string) => {
    setPlayingWordAudio(word);
    sounds.playClick();
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(() => {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(word);
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
        }
      });
      audio.onended = () => setPlayingWordAudio(null);
      audio.onerror = () => setPlayingWordAudio(null);
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.onend = () => setPlayingWordAudio(null);
      utterance.onerror = () => setPlayingWordAudio(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Handle Send Telegram Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) {
      alert('Iltimos, xabar matnini kiriting');
      return;
    }

    if (broadcastTarget === 'single') {
      if (!selectedTargetUser) {
        alert('Iltimos, xabar yuborish uchun foydalanuvchini tanlang');
        return;
      }
      if (!selectedTargetUser.telegram_id) {
        alert(`"${selectedTargetUser.full_name}" da Telegram ID ulanmagan.`);
        return;
      }
    }

    setIsSendingBroadcast(true);
    setBroadcastResult(null);

    try {
      const endpoints = ['/api/admin-broadcast', 'https://www.lexis4000.uz/api/admin-broadcast'];
      let resData: any = null;
      let ok = false;

      const payload: any = {
        title: broadcastTitle,
        message: broadcastMessage,
        button_text: broadcastButtonText,
        button_url: broadcastButtonUrl,
        target_type: broadcastTarget
      };

      if (broadcastTarget === 'single' && selectedTargetUser?.telegram_id) {
        payload.target_chat_id = selectedTargetUser.telegram_id;
      }

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            resData = await res.json();
            ok = true;
            break;
          } else {
            const errData = await res.json().catch(() => null);
            if (errData?.error) {
              throw new Error(errData.error);
            }
          }
        } catch (err: any) {
          if (err.message && err.message !== 'Failed to fetch') {
            throw err;
          }
        }
      }

      if (ok && resData && resData.ok) {
        sounds.playCorrect();
        const recipientText = broadcastTarget === 'single' && selectedTargetUser
          ? `"${selectedTargetUser.full_name}" ga`
          : `${resData.sent_count} ta foydalanuvchiga`;
        setBroadcastResult({
          ok: true,
          message: `Xabarnoma muvaffaqiyatli yuborildi! (${recipientText})`,
          count: resData.sent_count
        });
      } else {
        throw new Error(resData?.error || 'Xabar yuborishda xatolik yuz berdi');
      }
    } catch (err: any) {
      sounds.playWrong();
      setBroadcastResult({
        ok: false,
        message: err.message || 'Xabar yuborishda xatolik yuz berdi'
      });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Handle Send Direct Telegram Message to 1 User
  const handleSendDirectMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!directMessageUser) return;

    const chatId = directMessageUser.telegram_id || (directMessageCustomChatId ? Number(directMessageCustomChatId) : null);
    if (!chatId) {
      alert('Foydalanuvchida Telegram ID yo‘q. Iltimos, Telegram Chat ID kiriting.');
      return;
    }

    if (!directMessageBody.trim()) {
      alert('Iltimos, xabar matnini kiriting.');
      return;
    }

    setIsSendingDirectMessage(true);
    setDirectMessageResult(null);

    try {
      const endpoints = ['/api/admin-broadcast', 'https://www.lexis4000.uz/api/admin-broadcast'];
      let resData: any = null;
      let ok = false;

      const payload = {
        title: directMessageTitle,
        message: directMessageBody,
        button_text: directMessageButtonText,
        button_url: directMessageButtonUrl,
        target_type: 'single',
        target_chat_id: chatId
      };

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            resData = await res.json();
            ok = true;
            break;
          } else {
            const errData = await res.json().catch(() => null);
            if (errData?.error) {
              throw new Error(errData.error);
            }
          }
        } catch (err: any) {
          if (err.message && err.message !== 'Failed to fetch') {
            throw err;
          }
        }
      }

      if (ok && resData && resData.ok) {
        sounds.playCorrect();
        setDirectMessageResult({
          ok: true,
          message: `Xabar "${directMessageUser.full_name}" ga yetkazildi!`
        });
        setDeleteToast(`"${directMessageUser.full_name}" ga Telegram xabar yetkazildi!`);
        setTimeout(() => setDeleteToast(null), 4000);
      } else {
        throw new Error(resData?.error || 'Xabar yuborilmadi');
      }
    } catch (err: any) {
      sounds.playWrong();
      setDirectMessageResult({
        ok: false,
        message: err.message || 'Xatolik yuz berdi'
      });
    } finally {
      setIsSendingDirectMessage(false);
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

  // Filtered Dictionary Words
  const filteredDictWords = useMemo(() => {
    let list = dictionaryWords;
    if (selectedUnitFilter > 0) {
      list = list.filter((w) => w.unit_number === selectedUnitFilter);
    }
    if (dictSearch.trim()) {
      const q = dictSearch.toLowerCase().trim();
      list = list.filter(
        (w) =>
          (w.word && w.word.toLowerCase().includes(q)) ||
          (w.translation_uz && w.translation_uz.toLowerCase().includes(q)) ||
          (w.definition_en && w.definition_en.toLowerCase().includes(q))
      );
    }
    return list;
  }, [dictionaryWords, dictSearch, selectedUnitFilter]);

  // ==========================================
  // VIEW 1: ADMIN LOGIN SCREEN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${isDark ? 'dark' : ''} bg-slate-950 flex flex-col justify-center items-center px-4 selection:bg-emerald-500/30`}>
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Official Logo & Portal Badge */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-center mb-4">
              <img
                src="/logo-dark.png"
                alt="LEXIS 4000"
                className="h-10 w-auto"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <Lock className="w-2.5 h-2.5" />
              <span>Xavfsiz Boshqaruv Portali</span>
            </div>
            <p className="text-xs text-slate-400">
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
          {/* Official Brand Logo */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="LEXIS 4000"
                className="h-8 w-auto dark:hidden"
              />
              <img
                src="/logo-dark.png"
                alt="LEXIS 4000"
                className="h-8 w-auto hidden dark:block"
              />
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Admin
              </span>
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
                setActiveTab('broadcast');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'broadcast'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Xabarnoma (Broadcast)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('dictionary');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'dictionary'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Lug‘at (4000 so‘z)</span>
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

            {/* Mobile Brand Logo */}
            <div className="lg:hidden flex items-center">
              <img
                src="/logo.png"
                alt="LEXIS 4000"
                className="h-7 w-auto dark:hidden"
              />
              <img
                src="/logo-dark.png"
                alt="LEXIS 4000"
                className="h-7 w-auto hidden dark:block"
              />
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white capitalize">
                {activeTab === 'dashboard' && 'Boshqaruv Paneli (Overview)'}
                {activeTab === 'users' && 'Foydalanuvchilar Bazasi'}
                {activeTab === 'broadcast' && 'Telegram Xabarnoma (Broadcast Markazi)'}
                {activeTab === 'dictionary' && 'Lug‘at Boshqaruvi (4000 ta so‘z)'}
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

                            {/* Action: Detail & Delete Modal */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setDirectMessageUser(user);
                                    setDirectMessageTitle('');
                                    setDirectMessageBody('');
                                    setDirectMessageButtonText('🌐 Saytga kirish');
                                    setDirectMessageButtonUrl('https://lexis4000.uz');
                                    setDirectMessageCustomChatId(user.telegram_id ? String(user.telegram_id) : '');
                                    setDirectMessageResult(null);
                                  }}
                                  title="Telegramdan xabar yuborish"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setSelectedUser(user)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                                >
                                  Batafsil
                                </button>
                                <button
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setDeletePasswordInput('');
                                    setShowDeletePassword(false);
                                    setDeleteError('');
                                  }}
                                  title="Foydalanuvchini o‘chirish"
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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
              TAB 3: TELEGRAM BROADCAST CENTER
              ========================================== */}
          {activeTab === 'broadcast' && (
            <div className="space-y-6 animate-fadeIn max-w-4xl">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Telegram Bot orqali ommaviy xabarnoma yuborish
                    </h3>
                    <p className="text-xs text-slate-400">
                      O‘quvchilarga yangiliklar, dars eslatmalari yoki motivatsion xabarlar yuboring
                    </p>
                  </div>
                </div>

                {/* Target Audience Selector */}
                <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kimlarga yuborilsin?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setBroadcastTarget('test_alem')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                        broadcastTarget === 'test_alem'
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">🧪 Test Rejim (Alem)</span>
                        {broadcastTarget === 'test_alem' && <Check className="w-4 h-4 text-amber-500" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Faqat sizning Telegramingizga (@alem_42) test xabari boradi
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBroadcastTarget('single')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                        broadcastTarget === 'single'
                          ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 text-sky-900 dark:text-sky-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">👤 Tanlangan O‘quvchiga</span>
                        {broadcastTarget === 'single' && <Check className="w-4 h-4 text-sky-500" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {selectedTargetUser ? selectedTargetUser.full_name : 'Ro‘yxatdan aniq 1 kishini tanlang'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBroadcastTarget('all')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                        broadcastTarget === 'all'
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">🌐 Barcha O‘quvchilarga</span>
                        {broadcastTarget === 'all' && <Check className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Barcha Telegram ulangan ({profiles.filter(p => Boolean(p.telegram_id)).length} ta) o‘quvchilarga
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBroadcastTarget('active_streak')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                        broadcastTarget === 'active_streak'
                          ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">🔥 Faol O‘quvchilarga</span>
                        {broadcastTarget === 'active_streak' && <Check className="w-4 h-4 text-rose-500" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Ketma-ket dars qilayotgan ({profiles.filter(p => (p.streak_days || 0) > 0).length} ta) o‘quvchilarga
                      </p>
                    </button>
                  </div>

                  {/* Single User Picker */}
                  {broadcastTarget === 'single' && (
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-sky-500" />
                          <span>Qaysi foydalanuvchiga yuborilsin?</span>
                        </label>
                        {selectedTargetUser && (
                          <button
                            type="button"
                            onClick={() => setSelectedTargetUser(null)}
                            className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-bold cursor-pointer"
                          >
                            Boshqa foydalanuvchi tanlash
                          </button>
                        )}
                      </div>

                      {selectedTargetUser ? (
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-500/60 shadow-xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                              {selectedTargetUser.avatar_url ? (
                                <img src={selectedTargetUser.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                              ) : (
                                selectedTargetUser.full_name?.charAt(0).toUpperCase() || 'U'
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                  {selectedTargetUser.full_name}
                                </h4>
                                {selectedTargetUser.username && (
                                  <span className="text-[11px] text-sky-500 font-semibold truncate">
                                    @{selectedTargetUser.username}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                {selectedTargetUser.telegram_id ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                                    ✅ TG ID: {selectedTargetUser.telegram_id}
                                  </span>
                                ) : (
                                  <span className="text-rose-500 font-bold">
                                    ⚠️ TG ID ulanmagan
                                  </span>
                                )}
                                <span className="text-slate-400 font-mono">
                                  ⚡️ {selectedTargetUser.total_xp || 0} XP
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedTargetUser(null)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              value={broadcastUserSearch}
                              onChange={(e) => setBroadcastUserSearch(e.target.value)}
                              placeholder="Foydalanuvchi ismi, @username yoki telefon raqami..."
                              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 transition"
                            />
                            {broadcastUserSearch && (
                              <button
                                type="button"
                                onClick={() => setBroadcastUserSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="max-h-60 overflow-y-auto space-y-1 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 bg-white dark:bg-slate-900 shadow-inner">
                            {profiles
                              .filter((p) => {
                                if (!broadcastUserSearch.trim()) return true;
                                const q = broadcastUserSearch.toLowerCase().trim();
                                return (
                                  (p.full_name && p.full_name.toLowerCase().includes(q)) ||
                                  (p.username && p.username.toLowerCase().includes(q)) ||
                                  (p.phone_number && p.phone_number.includes(q))
                                );
                              })
                              .slice(0, 12)
                              .map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => setSelectedTargetUser(p)}
                                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                                      {p.avatar_url ? (
                                        <img src={p.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
                                      ) : (
                                        p.full_name?.charAt(0).toUpperCase() || 'U'
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                        {p.full_name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {p.username ? `@${p.username}` : p.phone_number || 'Username yo‘q'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    {p.telegram_id ? (
                                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                                        TG: {p.telegram_id}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-medium text-amber-500">
                                        TG ulanmagan
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Broadcast Form */}
                <form onSubmit={handleSendBroadcast} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Xabar sarlavhasi (Ixtiyoriy)
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="masalan: 🚀 LEXIS 4000 da yangi imkoniyatlar!"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Xabar matni (HTML teglari qo‘llab-quvvatlanadi: &lt;b&gt;, &lt;i&gt;) *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Assalomu alaykum! Bugungi kunlik so‘z mashqlarini bajarishni unutmang. Har kuni 20 ta so‘z sizni C1 darajasiga yetaklaydi..."
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Inline Tugma Matni (Ixtiyoriy)
                      </label>
                      <input
                        type="text"
                        value={broadcastButtonText}
                        onChange={(e) => setBroadcastButtonText(e.target.value)}
                        placeholder="masalan: 🌐 Saytga kirish"
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tugma Havolasi (URL)
                      </label>
                      <input
                        type="url"
                        value={broadcastButtonUrl}
                        onChange={(e) => setBroadcastButtonUrl(e.target.value)}
                        placeholder="https://lexis4000.uz"
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  {/* Result status alert */}
                  {broadcastResult && (
                    <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                      broadcastResult.ok
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}>
                      {broadcastResult.ok ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                      <span>{broadcastResult.message}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSendingBroadcast || !broadcastMessage.trim()}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {isSendingBroadcast ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Yuborilmoqda...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>
                            {broadcastTarget === 'test_alem' ? 'Test xabarni yuborish' : 'Xabarnomani tarqatish'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 4: DICTIONARY EXPLORER (4000 WORDS)
              ========================================== */}
          {activeTab === 'dictionary' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Toolbar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={dictSearch}
                      onChange={(e) => setDictSearch(e.target.value)}
                      placeholder="Inglizcha yoki o‘zbekcha so‘z qidirish..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 transition"
                    />
                    {dictSearch && (
                      <button
                        onClick={() => setDictSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Book Selector Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => loadDictionaryBook(0)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        selectedBook === 0
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Barchasi (1-6)
                    </button>
                    {[1, 2, 3, 4, 5, 6].map((bNum) => (
                      <button
                        key={bNum}
                        onClick={() => loadDictionaryBook(bNum)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                          selectedBook === bNum
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        Kitob {bNum}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unit Filter if specific book selected */}
                {selectedBook > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">Unit:</span>
                    <button
                      onClick={() => { setSelectedUnitFilter(0); setDictVisibleCount(60); }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                        selectedUnitFilter === 0
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      Barchasi
                    </button>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((uNum) => (
                      <button
                        key={uNum}
                        onClick={() => { setSelectedUnitFilter(uNum); setDictVisibleCount(60); }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                          selectedUnitFilter === uNum
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        U{uNum}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Words Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-xs overflow-hidden">
                {loadingDictionary ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    <span className="text-xs">Kitob so‘zlari yuklanmoqda...</span>
                  </div>
                ) : filteredDictWords.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Hech qanday so‘z topilmadi
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">So‘z & Talaffuz</th>
                          <th className="py-3 px-4">Turkumi</th>
                          <th className="py-3 px-4">O‘zbekcha Tarjima</th>
                          <th className="py-3 px-4">Inglizcha Ta’rif</th>
                          <th className="py-3 px-4">Unit</th>
                          <th className="py-3 px-4 text-right">Ovoz</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {filteredDictWords.slice(0, dictVisibleCount).map((w) => (
                          <tr key={w.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 dark:text-white block text-sm">
                                {w.word}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {w.phonetic || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                              {w.part_of_speech || '-'}
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                              {w.translation_uz || '-'}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={w.definition_en}>
                              {w.definition_en}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                              B{w.book_number}-U{w.unit_number}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handlePlayAudio(w.audio_url, w.word)}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  playingWordAudio === w.word
                                    ? 'bg-emerald-500 text-white scale-110'
                                    : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                }`}
                                title="Talaffuzni eshitish"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {filteredDictWords.length > dictVisibleCount && (
                  <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <button
                      onClick={() => setDictVisibleCount((c) => c + 60)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer"
                    >
                      Yana 60 ta so‘z ko‘rsatish ({filteredDictWords.length - dictVisibleCount} ta qoldi)
                    </button>
                  </div>
                )}

                <div className="p-3 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-400 text-center">
                  Ko‘rsatilmoqda: <span className="font-bold text-slate-700 dark:text-slate-200">{Math.min(dictVisibleCount, filteredDictWords.length)}</span> / {filteredDictWords.length} ta so‘z ({selectedBook === 0 ? 'Barcha 4000 ta so‘z' : `Kitob ${selectedBook}`}{selectedUnitFilter > 0 ? `, Unit ${selectedUnitFilter}` : ''})
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 5: UNIT PROGRESS MONITORING
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

              {/* XP and Streak Section (With Edit capabilities) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Natijalar (XP & Streak)</span>
                  </span>
                  {!isEditingScores ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingScores(true)}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/60 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Tahrirlash</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingScores(false);
                        setEditXpInput(selectedUser.total_xp || 0);
                        setEditStreakInput(selectedUser.streak_days || 0);
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                  )}
                </div>

                {!isEditingScores ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-medium block">Jami XP:</span>
                      <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                        ⚡️ {selectedUser.total_xp || 0} XP
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-medium block">Ketma-ketlik:</span>
                      <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                        🔥 {selectedUser.streak_days || 0} kun
                      </span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveScores} className="space-y-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          XP Ballari:
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditXpInput((v) => Number(v) + 50)}
                            className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200 cursor-pointer"
                          >
                            +50
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditXpInput((v) => Number(v) + 100)}
                            className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200 cursor-pointer"
                          >
                            +100
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditXpInput((v) => Number(v) + 500)}
                            className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200 cursor-pointer"
                          >
                            +500
                          </button>
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={editXpInput}
                        onChange={(e) => setEditXpInput(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-1.5 text-sm font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          Ketma-ketlik (Streak kunlari):
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditStreakInput((v) => Number(v) + 1)}
                            className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 cursor-pointer"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditStreakInput((v) => Number(v) + 7)}
                            className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 cursor-pointer"
                          >
                            +7
                          </button>
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={editStreakInput}
                        onChange={(e) => setEditStreakInput(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-1.5 text-sm font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingScores}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {isSavingScores ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{isSavingScores ? 'Saqlanmoqda...' : 'Ko‘rsatkichlarni saqlash'}</span>
                    </button>
                  </form>
                )}
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
            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  setUserToDelete(target);
                  setDeletePasswordInput('');
                  setShowDeletePassword(false);
                  setDeleteError('');
                }}
                className="px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>O‘chirish</span>
              </button>

              <button
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  setDirectMessageUser(target);
                  setDirectMessageTitle('');
                  setDirectMessageBody('');
                  setDirectMessageButtonText('🌐 Saytga kirish');
                  setDirectMessageButtonUrl('https://lexis4000.uz');
                  setDirectMessageCustomChatId(target.telegram_id ? String(target.telegram_id) : '');
                  setDirectMessageResult(null);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegramdan xabar</span>
              </button>

              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DIRECT TELEGRAM MESSAGE MODAL (1-ON-1)
          ========================================== */}
      {directMessageUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => {
            if (!isSendingDirectMessage) {
              setDirectMessageUser(null);
              setDirectMessageResult(null);
            }
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900/40 flex items-center justify-center text-sky-500">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Telegram orqali shaxsiy xabar
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Foydalanuvchiga Telegram boti nomidan to‘g‘ridan-to‘g‘ri xabar yetkaziladi
                  </p>
                </div>
              </div>
              <button
                disabled={isSendingDirectMessage}
                onClick={() => {
                  setDirectMessageUser(null);
                  setDirectMessageResult(null);
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recipient Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {directMessageUser.avatar_url ? (
                    <img src={directMessageUser.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    directMessageUser.full_name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                    {directMessageUser.full_name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {directMessageUser.username ? `@${directMessageUser.username}` : directMessageUser.phone_number || 'ID: ' + directMessageUser.id.substring(0, 8)}
                  </p>
                </div>
              </div>
              <div>
                {directMessageUser.telegram_id ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    TG: {directMessageUser.telegram_id}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    TG ulanmagan
                  </span>
                )}
              </div>
            </div>

            {/* If no Telegram ID, allow entering manually */}
            {!directMessageUser.telegram_id && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-2">
                <div className="flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Foydalanuvchi saytga Telegram orqali kirmagan. Agar uning Chat ID sini bilsangiz, pastga yozing:
                  </span>
                </div>
                <input
                  type="text"
                  value={directMessageCustomChatId}
                  onChange={(e) => setDirectMessageCustomChatId(e.target.value)}
                  placeholder="Telegram Chat ID (masalan: 1102377043)"
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono"
                />
              </div>
            )}

            {/* Quick Templates */}
            <div className="mb-3">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                Tezkor shablonlar:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDirectMessageTitle('⏰ Dars vaqti keldi!');
                    setDirectMessageBody(`Assalomu alaykum, ${directMessageUser.full_name}! Lexis 4000 da bugungi so‘z mashg‘ulotlarini bajarishni unutmang. Ketma-ketlikni boy bermang! 🔥`);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                >
                  🔥 Dars eslatmasi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirectMessageTitle('💪 O‘rganishda davom eting!');
                    setDirectMessageBody(`Salom, ${directMessageUser.full_name}! Har kuni atigi 10-15 daqiqa ingliz tili o‘rganish natijani keskin oshiradi. Yangi 20 ta so‘z sizni kutmoqda! 🚀`);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                >
                  💪 Motivatsiya
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirectMessageTitle('🎉 Ajoyib natija!');
                    setDirectMessageBody(`Tabriklaymiz, ${directMessageUser.full_name}! Siz Lexis 4000 da faollik ko‘rsatib, ajoyib natijaga erishdingiz. Yangi marralar sari olg‘a! ⭐️`);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                >
                  🎉 Tabrik
                </button>
              </div>
            </div>

            {/* Direct Message Form */}
            <form onSubmit={handleSendDirectMessage} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sarlavha (Ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={directMessageTitle}
                  onChange={(e) => setDirectMessageTitle(e.target.value)}
                  placeholder="masalan: ⏰ Kunlik mashg‘ulot eslatmasi"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Xabar matni *
                </label>
                <textarea
                  rows={4}
                  required
                  value={directMessageBody}
                  onChange={(e) => setDirectMessageBody(e.target.value)}
                  placeholder="Xabaringizni yozing..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tugma matni (Ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={directMessageButtonText}
                    onChange={(e) => setDirectMessageButtonText(e.target.value)}
                    placeholder="🌐 Saytga kirish"
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tugma havolasi (URL)
                  </label>
                  <input
                    type="url"
                    value={directMessageButtonUrl}
                    onChange={(e) => setDirectMessageButtonUrl(e.target.value)}
                    placeholder="https://lexis4000.uz"
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Status Alert */}
              {directMessageResult && (
                <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  directMessageResult.ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}>
                  {directMessageResult.ok ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{directMessageResult.message}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSendingDirectMessage}
                  onClick={() => {
                    setDirectMessageUser(null);
                    setDirectMessageResult(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  disabled={isSendingDirectMessage || !directMessageBody.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95"
                >
                  {isSendingDirectMessage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Xabarni yuborish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          DELETE USER CONFIRMATION MODAL (PASSWORD REQUIRED)
          ========================================== */}
      {userToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => {
            if (!isDeletingUser) {
              setUserToDelete(null);
              setDeletePasswordInput('');
              setDeleteError('');
            }
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Foydalanuvchini o‘chirish
                </h3>
              </div>
              <button
                disabled={isDeletingUser}
                onClick={() => {
                  setUserToDelete(null);
                  setDeletePasswordInput('');
                  setDeleteError('');
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target User Info */}
            <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 mb-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                {userToDelete.avatar_url ? (
                  <img src={userToDelete.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  userToDelete.full_name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {userToDelete.full_name}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  <span>ID: {userToDelete.id}</span>
                  {userToDelete.username && (
                    <span>• @{userToDelete.username}</span>
                  )}
                </div>
                {userToDelete.phone_number && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    📱 {userToDelete.phone_number}
                  </p>
                )}
              </div>
            </div>

            {/* Warning Text */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 mb-4 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-black">Ogohlantirish:</strong> Ushbu foydalanuvchi ma’lumotlar bazasidan butunlay o‘chiriladi. Uning barcha XP, streak va unit natijalari yo‘qoladi. Bu amalni qaytarib bo‘lmaydi!
              </p>
            </div>

            {/* Password Form */}
            <form onSubmit={handleConfirmDeleteUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tasdiqlash uchun Admin parolingizni kiriting:
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    value={deletePasswordInput}
                    onChange={(e) => {
                      setDeletePasswordInput(e.target.value);
                      if (deleteError) setDeleteError('');
                    }}
                    placeholder="Admin paroli..."
                    autoFocus
                    disabled={isDeletingUser}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {deleteError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-medium animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeletingUser}
                  onClick={() => {
                    setUserToDelete(null);
                    setDeletePasswordInput('');
                    setDeleteError('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isDeletingUser || !deletePasswordInput.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95"
                >
                  {isDeletingUser ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>O‘chirilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>O‘chirishni tasdiqlash</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Success Toast */}
      {deleteToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl animate-fadeIn text-xs font-bold border border-emerald-500">
          <Check className="w-4 h-4" />
          <span>{deleteToast}</span>
        </div>
      )}
    </div>
  );
};
