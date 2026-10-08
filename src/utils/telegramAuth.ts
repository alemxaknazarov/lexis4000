import type { UserProfile } from '../lib/supabase';

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
 * Verifies OTP code via secure serverless endpoint.
 *
 * Security note: Client-side Supabase fallback was intentionally removed.
 * If both server endpoints are unreachable, the user must retry.
 * This prevents brute-force attacks on 6-digit OTP codes.
 */
export async function verifyTelegramOtp(code: string): Promise<UserProfile> {
  const cleanCode = code.trim();

  if (!cleanCode || cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
    throw new Error('Kod 6 ta raqamdan iborat bo\'lishi kerak.');
  }

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
      // Re-throw known user-facing errors immediately (don't try next endpoint)
      if (
        err.message &&
        (err.message.includes('noto\'g\'ri') ||
          err.message.includes('muddati') ||
          err.message.includes('6 ta raqam'))
      ) {
        throw err;
      }
      // Network/server error — try next endpoint
    }
  }

  // Both endpoints unreachable — throw clear message (no client-side fallback)
  throw new Error(
    'Server bilan ulanishda xatolik yuz berdi. Internet aloqangizni tekshirib, qayta urinib ko\'ring.'
  );
}
