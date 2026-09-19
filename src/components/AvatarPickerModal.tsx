import React, { useState, useMemo } from 'react';
import { X, Check, Sparkles, UserCheck, Crown } from 'lucide-react';
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

type FilterCategory = 'all' | 'boys' | 'girls' | 'mascots';

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onSelectAvatar,
  currentUser
}) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [selectedUrl, setSelectedUrl] = useState<string>(
    getAvatarUrl(currentAvatarUrl) || AVATAR_LIST[0].url
  );
  const [saving, setSaving] = useState<boolean>(false);

  // Check if current user is Alem (Project Founder)
  const isAlem = Boolean(
    currentUser && (
      currentUser.telegram_id === 1102377043 ||
      currentUser.username?.toLowerCase() === 'alem_42' ||
      currentUser.full_name?.toLowerCase().includes('alem') ||
      (typeof window !== 'undefined' && (
        sessionStorage.getItem('lexis_admin_auth') === 'true' ||
        localStorage.getItem('lexis_admin_session') === 'true'
      ))
    )
  );

  // Available avatars: If not Alem, completely hide exclusive avatars so others don't even see them!
  const availableAvatars = useMemo(() => {
    return AVATAR_LIST.filter((a) => !a.isExclusive || isAlem);
  }, [isAlem]);

  if (!isOpen) return null;

  const filteredAvatars = activeCategory === 'all'
    ? availableAvatars
    : availableAvatars.filter((a) => a.category === activeCategory);

  const handleSelectAvatarItem = (avatar: AvatarItem) => {
    if (avatar.isExclusive && !isAlem) {
      return;
    }
    sounds.playClick();
    setSelectedUrl(avatar.url);
  };

  const handleSave = async () => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Avatar tanlash
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Profil va reytingda ko‘rinadigan 3D qahramon
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
            Barchasi ({availableAvatars.length})
          </button>
          <button
            onClick={() => setActiveCategory('boys')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'boys'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            O‘g‘il bolalar ({availableAvatars.filter((a) => a.category === 'boys').length})
          </button>
          <button
            onClick={() => setActiveCategory('girls')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'girls'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Qizlar ({availableAvatars.filter((a) => a.category === 'girls').length})
          </button>
          <button
            onClick={() => setActiveCategory('mascots')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeCategory === 'mascots'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Qahramonlar ({availableAvatars.filter((a) => a.category === 'mascots').length})
          </button>
        </div>

        {/* Avatars Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {filteredAvatars.map((avatar: AvatarItem) => {
            const isSelected = selectedUrl === avatar.url;

            return (
              <div
                key={avatar.id}
                onClick={() => handleSelectAvatarItem(avatar)}
                className={`relative group aspect-square rounded-2xl p-1.5 border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/15 scale-[1.03]'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.02]'
                }`}
              >
                {/* Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm z-10 animate-scaleUp">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Exclusive Alem Badge */}
                {avatar.isExclusive && isAlem && (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-emerald-500 text-white font-black text-[9px] shadow-xs flex items-center gap-0.5 z-10 animate-pulse">
                    <Crown className="w-2.5 h-2.5 fill-white" />
                    <span>Alem VIP</span>
                  </div>
                )}

                {/* Avatar Image */}
                <div className="w-full h-full rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-2xs transition-transform group-hover:scale-105">
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {saving ? (
              <span>Saqlanmoqda...</span>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Tanlash</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
