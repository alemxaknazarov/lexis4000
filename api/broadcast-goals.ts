import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://edxexhujreeckecqbryy.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ha2IXQ54aPfxHLDSW6RQnA_8Miju1HS';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: any, res: any) {
  // Allow GET or POST to trigger broadcast after deploy
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is missing' });
  }

  const api = `https://api.telegram.org/bot${token}`;

  try {
    // 1. Fetch all registered users with telegram_id
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, telegram_id, full_name')
      .not('telegram_id', 'is', null);

    if (error || !users) {
      return res.status(500).json({ error: 'Database query failed', details: error });
    }

    const sentUsers: number[] = [];
    const failedUsers: number[] = [];

    for (const user of users) {
      if (!user.telegram_id) continue;

      const firstName = (user.full_name || 'Qadrdon o‘quvchi').split(' ')[0];

      const announcementText =
        `🚀 <b>LEXIS 4000 da yangi imkoniyatlar!</b>\n\n` +
        `Assalomu alaykum, <b>${firstName}</b>!\n\n` +
        `Platformamizda <b>Shaxsiy Maqsadlar va CEFR/IELTS</b> tizimi to‘liq ishga tushirildi.\n\n` +
        `Endi siz o‘z profilingizda:\n` +
        `• 🎓 <b>CEFR (A1 — C1)</b> yoki 🎯 <b>IELTS (Band 9)</b> yo‘nalishini tanlashingiz;\n` +
        `• ⚡️ Kunlik so‘z yodlash rejasini belgilashingiz <i>(1 ta so‘z = 1 XP)</i>;\n` +
        `• 📈 Haftalik faollik va o‘zlashtirish darajangizni kuzatib borishingiz mumkin!\n\n` +
        `Quyidagi tugmani bosing va 30 soniyada o‘z shaxsiy rejangizni belgilab oling:`;

      try {
        const sendRes = await fetch(`${api}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_id,
            text: announcementText,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🎯 Shaxsiy maqsadimni belgilash',
                    callback_data: 'cb_start_onboarding'
                  }
                ],
                [
                  {
                    text: '🌐 Saytga kirish',
                    url: 'https://lexis4000.uz'
                  }
                ]
              ]
            }
          })
        });

        const data = await sendRes.json();
        if (data && data.ok) {
          sentUsers.push(user.telegram_id);
        } else {
          failedUsers.push(user.telegram_id);
        }
      } catch (e) {
        failedUsers.push(user.telegram_id);
      }
    }

    return res.status(200).json({
      ok: true,
      message: 'Broadcast completed',
      sent_count: sentUsers.length,
      failed_count: failedUsers.length,
      sent_users: sentUsers
    });
  } catch (err: any) {
    console.error('[broadcast-goals] Error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
