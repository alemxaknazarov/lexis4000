import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://edxexhujreeckecqbryy.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ha2IXQ54aPfxHLDSW6RQnA_8Miju1HS';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { title, message, button_text, button_url, target_type } = req.body || {};
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is missing on server' });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message body cannot be empty' });
  }

  const api = `https://api.telegram.org/bot${token}`;

  try {
    let targetIds: number[] = [];

    if (target_type === 'test_alem') {
      // Send only to Alem for safe preview
      targetIds = [1102377043];
    } else if (target_type === 'active_streak') {
      // Send only to users with streak > 0
      const { data: activeUsers } = await supabase
        .from('profiles')
        .select('telegram_id')
        .not('telegram_id', 'is', null)
        .gt('streak_days', 0);

      targetIds = (activeUsers || [])
        .map((u) => u.telegram_id)
        .filter((id): id is number => Boolean(id));
    } else {
      // Send to all registered users with a telegram_id
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('telegram_id')
        .not('telegram_id', 'is', null);

      targetIds = (allUsers || [])
        .map((u) => u.telegram_id)
        .filter((id): id is number => Boolean(id));
    }

    // Deduplicate IDs
    const uniqueIds = Array.from(new Set(targetIds));

    if (uniqueIds.length === 0) {
      return res.status(200).json({
        ok: true,
        message: 'No recipients found for this target',
        sent_count: 0,
        failed_count: 0
      });
    }

    // Compose formatted text
    let fullText = '';
    if (title && title.trim()) {
      fullText += `📢 <b>${title.trim()}</b>\n\n`;
    }
    fullText += message.trim();

    // Compose reply markup if button provided
    let replyMarkup: any = undefined;
    if (button_text && button_text.trim() && button_url && button_url.trim()) {
      replyMarkup = {
        inline_keyboard: [
          [
            {
              text: button_text.trim(),
              url: button_url.trim()
            }
          ]
        ]
      };
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const chatId of uniqueIds) {
      try {
        const payload: any = {
          chat_id: chatId,
          text: fullText,
          parse_mode: 'HTML'
        };
        if (replyMarkup) {
          payload.reply_markup = replyMarkup;
        }

        const sendRes = await fetch(`${api}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await sendRes.json();
        if (data && data.ok) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    return res.status(200).json({
      ok: true,
      sent_count: sentCount,
      failed_count: failedCount,
      total: uniqueIds.length
    });
  } catch (err: any) {
    console.error('[admin-broadcast] Error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
