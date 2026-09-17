import React, { useState, useEffect } from 'react';
import { X, Trophy, Flame, Award, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/supabase';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, total_xp, streak_days')
        .order('total_xp', { ascending: false })
        .limit(20);

      if (!error && data) {
        setLeaders(data);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaders();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Yopish"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>O‘quvchilar Reytingi</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Eng faol va yuqori XP to‘plagan bilimdonlar
            </p>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
              <span className="text-xs">Reyting yangilanmoqda...</span>
            </div>
          ) : leaders.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Hozircha reytingda o‘quvchilar yo‘q. Birinchi bo‘ling!
            </div>
          ) : (
            leaders.map((user, index) => {
              const rank = index + 1;
              const isMe = currentUser?.id === user.id || (currentUser?.telegram_id && currentUser.telegram_id === user.telegram_id);

              let rankBadge = (
                <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-xs flex items-center justify-center">
                  {rank}
                </span>
              );

              if (rank === 1) {
                rankBadge = (
                  <span className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-300 dark:border-amber-700 shadow-xs">
                    🥇
                  </span>
                );
              } else if (rank === 2) {
                rankBadge = (
                  <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-300 dark:border-slate-600 shadow-xs">
                    🥈
                  </span>
                );
              } else if (rank === 3) {
                rankBadge = (
                  <span className="w-6 h-6 rounded-md bg-amber-900/10 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-600/30 shadow-xs">
                    🥉
                  </span>
                );
              }

              return (
                <div
                  key={user.id || index}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                    isMe
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-500/20'
                      : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {rankBadge}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {user.full_name || 'O‘quvchi'}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                            Siz
                          </span>
                        )}
                      </div>
                      {user.username && (
                        <span className="text-[10px] text-slate-400 block truncate">
                          @{user.username}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400 font-semibold" title={`${user.streak_days || 0} kun ketma-ket`}>
                      <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{user.streak_days || 0}k</span>
                    </div>

                    <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md text-xs font-mono font-bold">
                      <Award className="w-3 h-3" />
                      <span>{user.total_xp || 0} XP</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Refresh */}
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Har bir unit 100 XP beradi</span>
          <button
            onClick={fetchLeaders}
            className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Yangilash</span>
          </button>
        </div>
      </div>
    </div>
  );
};
