import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://edxexhujreeckecqbryy.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ha2IXQ54aPfxHLDSW6RQnA_8Miju1HS';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: any, res: any) {
  // 1. CORS headers for cross-origin client requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { telegram_id, message_id, message_ids } = req.body || {};
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;

  if (!token || !telegram_id) {
    return res.status(400).json({ error: 'Missing token or telegram_id' });
  }

  const api = `https://api.telegram.org/bot${token}`;

  try {
    const toDelete = new Set<number>();

    // Add explicitly passed message IDs
    if (typeof message_id === 'number') {
      toDelete.add(message_id);
    }
    if (Array.isArray(message_ids)) {
      message_ids.forEach((id: any) => {
        const n = Number(id);
        if (!isNaN(n) && n > 0) toDelete.add(n);
      });
    }

    // Query recent auth codes for this user to gather any tracked message IDs
    try {
      const { data: recentCodes } = await supabase
        .from('telegram_auth_codes')
        .select('id, last_name')
        .eq('telegram_id', telegram_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentCodes && recentCodes.length > 0) {
        for (const codeRec of recentCodes) {
          if (codeRec.last_name && codeRec.last_name.startsWith('msg_')) {
            const rawParts = codeRec.last_name.replace('msg_', '').split('_');
            for (const part of rawParts) {
              const parsed = parseInt(part, 10);
              if (!isNaN(parsed) && parsed > 0) {
                toDelete.add(parsed);
              }
            }
          }
        }
      }
    } catch (dbErr) {
      console.warn('[notify-login] Supabase query error:', dbErr);
    }

    // Delete all temporary code and request messages
    for (const msgId of toDelete) {
      try {
        await fetch(`${api}/deleteMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegram_id,
            message_id: msgId
          })
        });
      } catch (_) {}
    }

    // Send congratulations message and restore keyboard
    await fetch(`${api}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegram_id,
        text: '🎉 <b>Tizimga kirganingiz bilan tabriklaymiz!</b>',
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [[{ text: '🔑 Kirish kodini olish' }]],
          resize_keyboard: true
        }
      })
    }).catch(() => {});

    return res.status(200).json({ ok: true, deleted: Array.from(toDelete) });
  } catch (err: any) {
    console.error('[notify-login] Error:', err);
    return res.status(200).json({ ok: true });
  }
}
