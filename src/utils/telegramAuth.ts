import type { UserProfile } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { checkAndUpdateStreak, getLocalDateString } from './streakManager';

/**
 * Notifies Telegram bot that user has logged in:
 * - Deletes the code message & request message from chat
 * - Sends congratulations message "🎉 Tizimga kirganingiz bilan tabriklaymiz!"
 * - Restores the "🔑 Kirish kodini olish" keyboard
 */
export async function notifyTelegramLogin(
  telegramId: number,
  messageIdTracker?: string | number
): Promise<void> {
  if (!telegramId) return;

  const messageIds: number[] = [];

  if (typeof messageIdTracker === 'number') {
    messageIds.push(messageIdTracker);
  } else if (typeof messageIdTracker === 'string' && messageIdTracker.startsWith('msg_')) {
    const parts = messageIdTracker.replace('msg_', '').split('_');
    for (const p of parts) {
      const n = parseInt(p, 10);
      if (!isNaN(n) && n > 0) messageIds.push(n);
    }
  }

  const payload = {
    telegram_id: telegramId,
    message_ids: messageIds
  };

  const endpoints = ['/api/notify-login', 'https://www.lexis4000.uz/api/notify-login'];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.ok) return;
      }
    } catch (_) {
      // Fallback to next endpoint
    }
  }
}

/**
 * Verifies OTP code via secure serverless endpoint with client-side fallback
 */
export async function verifyTelegramOtp(code: string): Promise<UserProfile> {
  const cleanCode = code.trim();
  const endpoints = ['/api/verify-code', 'https://www.lexis4000.uz/api/verify-code'];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && data.profile) {
          if (data.goal) {
            if (data.goal.track) localStorage.setItem('lexis_learning_track', data.goal.track);
            if (data.goal.target) localStorage.setItem('lexis_target_level', data.goal.target);
            if (data.goal.daily) localStorage.setItem('lexis_daily_goal', data.goal.daily);
          }
          return data.profile as UserProfile;
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (errorData?.error) {
          throw new Error(errorData.error);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('noto‘g‘ri')) {
        throw err;
      }
      // Continue to next endpoint or fallback
    }
  }

  // Graceful fallback to direct Supabase verification if endpoints are unreachable
  const nowIso = new Date().toISOString();
  const { data: codeRecord, error: codeErr } = await supabase
    .from('telegram_auth_codes')
    .select('*')
    .eq('code', cleanCode)
    .eq('used', false)
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (codeErr || !codeRecord) {
    throw new Error('Kod noto‘g‘ri yoki muddati (3 daqiqa) tugagan. Botdan yangi kod oling.');
  }

  // Mark code as used
  await supabase
    .from('telegram_auth_codes')
    .update({ used: true })
    .eq('id', codeRecord.id);

  // Notify Telegram bot
  notifyTelegramLogin(codeRecord.telegram_id, codeRecord.last_name).catch(() => {});

  // Fetch or create profile
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('telegram_id', codeRecord.telegram_id)
    .maybeSingle();

  let finalProfile: UserProfile;

  if (existingUser) {
    const streakRes = await checkAndUpdateStreak(existingUser);
    finalProfile = streakRes.profile || existingUser;
  } else {
    const todayStr = getLocalDateString();
    const fullName = `${codeRecord.first_name || ''} ${codeRecord.last_name || ''}`.replace(/msg_\S+/, '').trim() ||
      codeRecord.username ||
      'O‘quvchi';

    const { data: newUser, error: createErr } = await supabase
      .from('profiles')
      .insert([
        {
          telegram_id: codeRecord.telegram_id,
          phone_number: codeRecord.phone_number,
          full_name: fullName,
          username: codeRecord.username || null,
          total_xp: 0,
          streak_days: 1,
          last_study_date: todayStr
        }
      ])
      .select()
      .single();

    if (createErr || !newUser) {
      throw new Error('Profil yaratishda xatolik yuz berdi.');
    }
    finalProfile = newUser;
  }

  // Extract goal in fallback
  if (codeRecord.last_name && codeRecord.last_name.includes('|goal:')) {
    const goalPart = codeRecord.last_name.split('|goal:')[1];
    if (goalPart) {
      const [track, target, daily] = goalPart.split('_');
      if (track) localStorage.setItem('lexis_learning_track', track);
      if (target) localStorage.setItem('lexis_target_level', target);
      if (daily) localStorage.setItem('lexis_daily_goal', daily);
    }
  }

  return finalProfile;
}
