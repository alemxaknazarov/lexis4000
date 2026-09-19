import React, { useState } from 'react';
import { X, Check, Sparkles, UserCheck, Lock, Crown, Zap, AlertCircle } from 'lucide-react';
import { AVATAR_LIST, getAvatarUrl, type AvatarItem } from '../data/avatars';
import type { UserProfile } from '../lib/supabase';
import { sounds } from '../utils/soundEffects';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  onSelectAvatar: (avatarUrl: string) => Promise<void>;
  currentUser?: UserProfile | null;
}

type FilterCategory = 'all' | 'superheroes' | 'boys' | 'girls' | 'mascots';

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onSelectAvatar,
  currentUser
}) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [selectedUrl, setSelectedUrl] = useState<string>(() => {
    const current = getAvatarUrl(currentAvatarUrl);
    if (current) return current;
    const firstFree = AVATAR_LIST.find((a) => a.requiredXp === 0);
    return firstFree ? firstFree.url : AVATAR_LIST[0].url;
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [lockToast, setLockToast] = useState<string | null>(null);

  // Check if current user is Alem (Project Founder)
  // Strictly check telegram_id or username to avoid false matches
  const isAlem = Boolean(
    currentUser && (
      currentUser.telegram_id === 1102377043 ||
      currentUser.username?.toLowerCase() === 'alem_42' ||
      (typeof window !== 'undefined' && (
        sessionStorage.getItem('lexis_admin_auth') === 'true' ||
        localStorage.getItem('lexis_admin_session') === 'true'
      ))
    )
  );

  const userXp = currentUser?.total_xp || 0;

  if (!isOpen) return null;

  const filteredAvatars = activeCategory === 'all'
    ? AVATAR_LIST
    : AVATAR_LIST.filter((a) => a.category === activeCategory);

  const handleSelectAvatarItem = (avatar: AvatarItem) => {
    const isUnlocked = isAlem || avatar.requiredXp === 0 || userXp >= avatar.requiredXp;

    if (!isUnlocked) {
      sounds.playWrong();
      const needed = avatar.requiredXp - userXp;
      const heroCategory = avatar.category === 'superheroes' ? 'superqahramon' : 'avatar';
      setLockToast(
        `🔒 Ushbu ${avatar.requiredXp} XP lik ${heroCategory}ni ochish uchun yana ${needed} XP to‘plang! (Sizda: ${userXp} XP)`
      );
      setTimeout(() => setLockToast(null), 3500);
      return;
    }

    sounds.playClick();
    setLockToast(null);
    setSelectedUrl(avatar.url);
  };

  const handleSave = async () => {
    // Safety check: verify selected avatar is actually unlocked
    const currentItem = AVATAR_LIST.find((a) => a.url === selectedUrl);
    if (currentItem && !isAlem && currentItem.requiredXp > 0 && userXp < currentItem.requiredXp) {
      sounds.playWrong();
      setLockToast(`🔒 Bu avatar qulflangan (${currentItem.requiredXp} XP talab qilinadi)`);
      return;
    }

    setSaving(true);
    try {
      await onSelectAvatar(selectedUrl);
      onClose();
    } catch (err) {
      console.error('Avatar save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const selectedItem = AVATAR_LIST.find((a) => a.url === selectedUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Avatar tanlash
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Marvel, DC va 3D qahramonlar kolleksiyasi
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Status Ribbon */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-xs">
            {isAlem ? (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                <Crown className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                <span>👑 Alem Rejimi: Barcha Marvel, DC va 3D avatarlar sizga 100% ochiq!</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Sizning balansingiz: <strong className="font-mono text-slate-900 dark:text-white font-bold">{userXp} XP</strong></span>
                </div>
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                  🦸 120-200 XP da Marvel & DC ochiladi
                </span>
              </>
            )}
          </div>
        </div>

        {/* Lock Toast Warning Banner */}
        {lockToast && (
          <div className="mx-4 sm:mx-6 mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="leading-snug">{lockToast}</span>
          </div>
        )}

        {/* Category Tabs */}
        <div className="px-5 sm:px-6 pt-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800/60">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Barchasi ({AVATAR_LIST.length})
          </button>
          <button
            onClick={() => setActiveCategory('superheroes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
              activeCategory === 'superheroes'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>🦸 Marvel & DC ({AVATAR_LIST.filter((a) => a.category === 'superheroes').length})</span>
          </button>
          <button
            onClick={() => setActiveCategory('boys')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'boys'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            O‘g‘il bolalar ({AVATAR_LIST.filter((a) => a.category === 'boys').length})
          </button>
          <button
            onClick={() => setActiveCategory('girls')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'girls'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Qizlar ({AVATAR_LIST.filter((a) => a.category === 'girls').length})
          </button>
          <button
            onClick={() => setActiveCategory('mascots')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'mascots'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Qahramonlar ({AVATAR_LIST.filter((a) => a.category === 'mascots').length})
          </button>
        </div>

        {/* Avatars Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {filteredAvatars.map((avatar: AvatarItem) => {
            const isSelected = selectedUrl === avatar.url;
            const isUnlocked = isAlem || avatar.requiredXp === 0 || userXp >= avatar.requiredXp;

            return (
              <div
                key={avatar.id}
                onClick={() => handleSelectAvatarItem(avatar)}
                className={`relative group aspect-square rounded-2xl p-1.5 border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/15 scale-[1.03]'
                    : !isUnlocked
                    ? 'border-slate-200/50 dark:border-slate-800/50 bg-slate-100/40 dark:bg-slate-950/40 opacity-75 hover:opacity-90'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.02]'
                }`}
              >
                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm z-20 animate-scaleUp">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Tier / Lock Badge */}
                {!isUnlocked ? (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-slate-900/85 text-white font-mono font-bold text-[9px] flex items-center gap-1 z-10 shadow-xs backdrop-blur-xs">
                    <Lock className="w-2.5 h-2.5 text-rose-400" />
                    <span>{avatar.requiredXp} XP</span>
                  </div>
                ) : avatar.category === 'superheroes' ? (
                  <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-white font-mono font-black text-[9px] flex items-center gap-0.5 z-10 shadow-xs ${
                    avatar.universe === 'Marvel'
                      ? 'bg-gradient-to-r from-red-600 to-rose-700'
                      : 'bg-gradient-to-r from-blue-700 to-indigo-900'
                  }`}>
                    <span>{avatar.universe}</span>
                    <span>•</span>
                    <span>{avatar.requiredXp} XP</span>
                  </div>
                ) : avatar.requiredXp === 100 ? (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 text-white font-mono font-black text-[9px] flex items-center gap-0.5 z-10 shadow-xs">
                    <Crown className="w-2.5 h-2.5 fill-white" />
                    <span>100 XP</span>
                  </div>
                ) : avatar.requiredXp === 50 ? (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-mono font-black text-[9px] flex items-center gap-0.5 z-10 shadow-xs">
                    <Zap className="w-2.5 h-2.5 fill-white" />
                    <span>50 XP</span>
                  </div>
                ) : null}

                {/* Avatar Image container */}
                <div className={`w-full h-full rounded-xl overflow-hidden shadow-2xs transition-transform flex items-center justify-center ${
                  avatar.url.endsWith('.png')
                    ? 'bg-slate-100 dark:bg-slate-800/80 p-2'
                    : 'bg-white dark:bg-slate-800'
                } ${
                  isUnlocked ? 'group-hover:scale-105' : 'grayscale-[40%] contrast-90'
                }`}>
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    className={`w-full h-full ${
                      avatar.url.endsWith('.png') ? 'object-contain' : 'object-cover'
                    }`}
                    loading="lazy"
                  />
                </div>

                {/* Lock Overlay on Hover if locked */}
                {!isUnlocked && (
                  <div className="absolute inset-0 rounded-2xl bg-slate-950/45 backdrop-blur-[1px] flex flex-col items-center justify-center text-white z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <Lock className="w-5 h-5 text-amber-400 mb-0.5" />
                    <span className="text-[10px] font-bold font-mono text-amber-300">
                      {avatar.requiredXp} XP kerak
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="min-w-0 flex-1">
            {selectedItem && (
              <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                Tanlandi: <strong className="text-slate-900 dark:text-white font-bold">{selectedItem.name}</strong>
                {selectedItem.requiredXp > 0 && (
                  <span className={`ml-1.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    selectedItem.category === 'superheroes'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {selectedItem.requiredXp} XP
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {saving ? (
                <span>Saqlanmoqda...</span>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Saqlash</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
