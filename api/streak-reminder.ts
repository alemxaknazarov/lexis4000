import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://edxexhujreeckecqbryy.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ha2IXQ54aPfxHLDSW6RQnA_8Miju1HS';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default async function handler(req: any, res: any) {
  // Allow GET or POST for Vercel Cron or manual test
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is missing' });
  }

  const api = `https://api.telegram.org/bot${token}`;
  const todayStr = getLocalDateString();

  try {
    // 1. Fetch users with telegram_id
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, telegram_id, full_name, streak_days, last_study_date')
      .not('telegram_id', 'is', null);

    if (error || !users) {
      return res.status(500).json({ error: 'Database query failed', details: error });
    }

    const notifiedUsers: any[] = [];

    // 2. Filter users who haven't studied today yet
    for (const user of users) {
      if (!user.telegram_id) continue;

      let lastDate = user.last_study_date;
      if (lastDate && lastDate.includes('T')) {
        lastDate = getLocalDateString(new Date(lastDate));
      }

      // If user has already studied today, do not disturb them
      if (lastDate === todayStr) continue;

      const currentStreak = user.streak_days || 1;
      const firstName = (user.full_name || 'O‘quvchi').split(' ')[0];

      const messageText =
        `🔥 Assalomu alaykum, <b>${firstName}</b>!\n\n` +
        `Bugungi <b>${currentStreak} kunlik</b> o‘rganish seriyangiz (streak) uzilib qolmasin!\n\n` +
        `Alanga o‘chmasligi uchun bugun atigi 5-10 daqiqa ajratib, 1 ta unitni yakunlang:\n\n` +
        `🌐 <a href="https://lexis4000.uz">LEXIS 4000 platformasiga kirish</a>`;

      try {
        const sendRes = await fetch(`${api}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_id,
            text: messageText,
            parse_mode: 'HTML',
            disable_web_page_preview: false,
            reply_markup: {
              keyboard: [[{ text: '🔑 Kirish kodini olish' }]],
              resize_keyboard: true
            }
          })
        });

        const sendData = await sendRes.json();
        if (sendData && sendData.ok) {
          notifiedUsers.push({ id: user.id, telegram_id: user.telegram_id });
        }
      } catch (sendErr) {
        console.warn(`[Streak Reminder] Failed to notify ${user.telegram_id}:`, sendErr);
      }
    }

    // 3. Database maintenance: Clean up expired codes older than 24 hours
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('telegram_auth_codes')
        .delete()
        .or(`used.eq.true,expires_at.lt.${oneDayAgo}`);
    } catch (cleanupErr) {
      console.warn('[Streak Reminder] DB cleanup notice:', cleanupErr);
    }

    return res.status(200).json({
      ok: true,
      message: 'Streak reminders processed',
      notified_count: notifiedUsers.length,
      notified_users: notifiedUsers
    });
  } catch (err: any) {
    console.error('[Streak Reminder] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
