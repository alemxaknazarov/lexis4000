import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://edxexhujreeckecqbryy.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ha2IXQ54aPfxHLDSW6RQnA_8Miju1HS';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('[Webhook] TELEGRAM_BOT_TOKEN is missing in process.env!');
    return null;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });
    const result = await res.json();
    console.log('[Webhook] Telegram send response:', result);
    return result;
  } catch (err) {
    console.error('[Webhook] Failed to send telegram message:', err);
    return null;
  }
}

async function deleteTelegramMessage(chatId: number, messageId: number) {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId
      })
    });
    return await res.json();
  } catch (err) {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  // Allow GET request for health check
  if (req.method === 'GET') {
    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN || '';
    const hasToken = !!token;
    const tokenLength = token ? token.length : 0;
    const matchingEnvKeys = Object.keys(process.env).filter(
      (k) => k.toLowerCase().includes('tele') || k.toLowerCase().includes('bot') || k.toLowerCase().includes('token')
    );
    return res.status(200).json({
      status: 'ok',
      service: 'LEXIS 4000 Telegram Webhook',
      hasToken,
      tokenLength,
      matchingEnvKeys
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const update = req.body;
  if (!update || !update.message) {
    return res.status(200).json({ ok: true });
  }

  const msg = update.message;
  const chatId = msg.chat.id;
  const from = msg.from;
  const text = msg.text?.trim() || '';
  const nowIso = new Date().toISOString();

  try {
    // 1. Fetch user profile from Supabase
    let userProfile: any = null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', from.id)
      .maybeSingle();
    userProfile = profile;

    // 2. Handle Contact Sharing (First-time registration)
    if (msg.contact) {
      const contact = msg.contact;
      const phoneNumber = contact.phone_number.startsWith('+')
        ? contact.phone_number
        : `+${contact.phone_number}`;

      const fullName = `${from.first_name || ''} ${from.last_name || ''}`.trim() || from.username || 'O‘quvchi';

      if (!userProfile) {
        const { data: created } = await supabase
          .from('profiles')
          .insert([
            {
              telegram_id: from.id,
              phone_number: phoneNumber,
              full_name: fullName,
              username: from.username || null,
              total_xp: 0,
              streak_days: 1
            }
          ])
          .select()
          .maybeSingle();
        userProfile = created;
      } else {
        await supabase
          .from('profiles')
          .update({ phone_number: phoneNumber, full_name: fullName, username: from.username || null })
          .eq('telegram_id', from.id);
      }

      await generateAndSendCode(chatId, from, phoneNumber, fullName);
      return res.status(200).json({ ok: true });
    }

    // 3. Check for existing active (unexpired & unused) code
    const { data: activeCodes } = await supabase
      .from('telegram_auth_codes')
      .select('*')
      .eq('telegram_id', from.id)
      .eq('used', false)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1);

    const activeCode = activeCodes && activeCodes.length > 0 ? activeCodes[0] : null;

    // If an active code exists and user sends a message or requests code again
    if (activeCode) {
      const remainingMs = new Date(activeCode.expires_at).getTime() - Date.now();
      const remainingSec = Math.max(0, Math.round(remainingMs / 1000));
      const mins = Math.floor(remainingSec / 60);
      const secs = remainingSec % 60;

      await sendTelegramMessage(
        chatId,
        `⏳ <b>Sizda amaldagi tasdiqlash kodi mavjud:</b>\n\n<code>${activeCode.code}</code>\n\nUshbu kod yana <b>${mins} daqiqa ${secs} soniya</b> davomida amal qiladi.`,
        {
          inline_keyboard: [
            [
              {
                text: '🌐 Saytga kirish',
                url: 'https://lexis4000.uz/login'
              }
            ]
          ]
        }
      );
      return res.status(200).json({ ok: true });
    }

    // Check if there was an expired code that wasn't used
    const { data: expiredCodes } = await supabase
      .from('telegram_auth_codes')
      .select('*')
      .eq('telegram_id', from.id)
      .eq('used', false)
      .lte('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1);

    if (expiredCodes && expiredCodes.length > 0) {
      // Mark as used
      await supabase
        .from('telegram_auth_codes')
        .update({ used: true })
        .eq('id', expiredCodes[0].id);

      // If previous message id was tracked in last_name, delete it
      if (expiredCodes[0].last_name && expiredCodes[0].last_name.startsWith('msg_')) {
        const prevMsgId = parseInt(expiredCodes[0].last_name.replace('msg_', ''), 10);
        if (!isNaN(prevMsgId)) {
          await deleteTelegramMessage(chatId, prevMsgId);
        }
      }

      await sendTelegramMessage(chatId, `❌ <b>Kod ishlatilmadi</b>`);
    }

    // 4. Handle "🔑 Kirish kodini olish" button or /login /code
    if (text === '🔑 Kirish kodini olish' || text === '/login' || text === '/code') {
      if (!userProfile) {
        await sendTelegramMessage(
          chatId,
          `Assalomu alaykum, <b>${from.first_name}</b>!\n\nSiz hali ro‘yxatdan o‘tmagansiz. Saytga kirish uchun avval <b>«📱 Telefon raqamni yuborish»</b> tugmasini bosing:`,
          {
            keyboard: [[{ text: '📱 Telefon raqamni yuborish', request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        );
        return res.status(200).json({ ok: true });
      }

      await generateAndSendCode(chatId, from, userProfile.phone_number || '', userProfile.full_name);
      return res.status(200).json({ ok: true });
    }

    // 5. Default Greeting
    if (userProfile) {
      await sendTelegramMessage(
        chatId,
        `Assalomu alaykum, <b>${userProfile.full_name || from.first_name}</b>!\n\nSaytga kirish uchun quyidagi <b>«🔑 Kirish kodini olish»</b> tugmasini bosing:`,
        {
          keyboard: [[{ text: '🔑 Kirish kodini olish' }]],
          resize_keyboard: true
        }
      );
    } else {
      await sendTelegramMessage(
        chatId,
        `Assalomu alaykum, <b>${from.first_name || 'Qadrdon o‘quvchi'}</b>!\n\n<b>LEXIS 4000</b> platformasiga xush kelibsiz.\n\nBir martalik ro‘yxatdan o‘tish uchun quyidagi <b>«📱 Telefon raqamni yuborish»</b> tugmasini bosing:`,
        {
          keyboard: [[{ text: '📱 Telefon raqamni yuborish', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      );
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[Webhook] Handler error:', err);
    return res.status(200).json({ ok: true });
  }
}

async function generateAndSendCode(chatId: number, from: any, phoneNumber: string, fullName: string) {
  // 1. Remove keyboard immediately
  const removeMsg = await sendTelegramMessage(chatId, '⏳', { remove_keyboard: true });
  if (removeMsg?.result?.message_id) {
    await deleteTelegramMessage(chatId, removeMsg.result.message_id);
  }

  // 2. Expire any previous unexpired codes
  await supabase
    .from('telegram_auth_codes')
    .update({ used: true })
    .eq('telegram_id', from.id)
    .eq('used', false);

  // 3. Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAtMs = Date.now() + 3 * 60 * 1000;
  const expiresAt = new Date(expiresAtMs).toISOString();

  // 4. Send code message with inline button
  const sentMsg = await sendTelegramMessage(
    chatId,
    `🔐 <b>Sizning bir martalik tasdiqlash kodingiz:</b>\n\n<code>${code}</code>\n\n⏳ Ushbu kod <b>3 daqiqa</b> davomida amal qiladi.`,
    {
      inline_keyboard: [
        [
          {
            text: '🌐 Saytga kirish',
            url: 'https://lexis4000.uz/login'
          }
        ]
      ]
    }
  );

  const sentMessageId = sentMsg?.result?.message_id;

  // 5. Save into database
  await supabase
    .from('telegram_auth_codes')
    .insert([
      {
        code,
        telegram_id: from.id,
        phone_number: phoneNumber,
        first_name: from.first_name,
        last_name: sentMessageId ? `msg_${sentMessageId}` : '',
        username: from.username || '',
        expires_at: expiresAt,
        used: false
      }
    ]);
}
