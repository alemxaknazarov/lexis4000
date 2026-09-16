import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = '8660002918:AAGasNFqfF-RzxA0IyfvdsFWUFKjgA2VmFQ';
const SUPABASE_URL = 'https://edxexhujreeckecqbryy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ha2IXQ54aPfxHLDSW6RQnA_8Miju1HS';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

let offset = 0;

interface ActiveSession {
  code: string;
  codeRecordId: string;
  chatId: number;
  telegramId: number;
  expiresAt: number; // timestamp in ms
  botMessageIds: number[];
  userMessageIds: number[];
  timer: NodeJS.Timeout;
  checkInterval?: NodeJS.Timeout;
}

const activeUserSessions = new Map<number, ActiveSession>();

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });
    return await res.json();
  } catch (err) {
    console.error('[Bot] Failed to send telegram message:', err);
    return null;
  }
}

async function deleteTelegramMessage(chatId: number, messageId: number) {
  try {
    const res = await fetch(`${TELEGRAM_API}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId
      })
    });
    return await res.json();
  } catch (err) {
    // Silently ignore deletion error
    return null;
  }
}

async function endSession(session: ActiveSession, result: 'used' | 'expired') {
  // 1. Clear timers and interval
  clearTimeout(session.timer);
  if (session.checkInterval) {
    clearInterval(session.checkInterval);
  }
  activeUserSessions.delete(session.telegramId);

  // 2. Delete all bot and user messages accumulated after code request
  const allIds = Array.from(new Set([...session.botMessageIds, ...session.userMessageIds]));
  for (const mId of allIds) {
    try {
      await deleteTelegramMessage(session.chatId, mId);
    } catch (_) {}
  }

  // 3. Send only the final result message with keyboard restored
  if (result === 'used') {
    await sendTelegramMessage(
      session.chatId,
      `🎉 <b>Tizimga kirganingiz bilan tabriklaymiz!</b>`,
      {
        keyboard: [[{ text: '🔑 Kirish kodini olish' }]],
        resize_keyboard: true
      }
    );
  } else {
    await sendTelegramMessage(
      session.chatId,
      `❌ <b>Kod ishlatilmadi</b>`,
      {
        keyboard: [[{ text: '🔑 Kirish kodini olish' }]],
        resize_keyboard: true
      }
    );
  }
}

async function handleUpdate(update: any) {
  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const from = msg.from;
  const text = msg.text?.trim() || '';

  // 1. If an active session is currently running for this user
  const activeSession = activeUserSessions.get(from.id);
  if (activeSession && activeSession.expiresAt > Date.now()) {
    if (msg.message_id) {
      activeSession.userMessageIds.push(msg.message_id);
    }

    const remainingSec = Math.max(0, Math.round((activeSession.expiresAt - Date.now()) / 1000));
    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;

    const replyMsg = await sendTelegramMessage(
      chatId,
      `⏳ <b>Sizda amaldagi tasdiqlash kodi mavjud:</b>\n\n<code>${activeSession.code}</code>\n\nUshbu kod yana <b>${mins} daqiqa ${secs} soniya</b> davomida amal qiladi.`,
      {
        inline_keyboard: [
          [
            {
              text: '🌐 Saytga kirish',
              url: 'https://lexis.uz/login'
            }
          ]
        ]
      }
    );

    if (replyMsg?.result?.message_id) {
      activeSession.botMessageIds.push(replyMsg.result.message_id);
    }
    return;
  }

  // 2. Check user profile in Supabase
  let userProfile: any = null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', from.id)
      .maybeSingle();
    userProfile = data;
  } catch (err) {
    console.error('[Bot] Error fetching profile:', err);
  }

  // 3. Handle Contact Sharing (First-time registration)
  if (msg.contact) {
    const contact = msg.contact;
    const phoneNumber = contact.phone_number.startsWith('+')
      ? contact.phone_number
      : `+${contact.phone_number}`;

    const fullName = `${from.first_name || ''} ${from.last_name || ''}`.trim() || from.username || 'O‘quvchi';

    try {
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
    } catch (err) {
      console.error('[Bot] Error saving profile:', err);
    }

    await startCodeSession(chatId, from, phoneNumber, fullName, msg.message_id);
    return;
  }

  // 4. Handle "🔑 Kirish kodini olish" button or commands
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
      return;
    }

    await startCodeSession(chatId, from, userProfile.phone_number || '', userProfile.full_name, msg.message_id);
    return;
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
}

async function startCodeSession(chatId: number, from: any, phoneNumber: string, fullName: string, incomingMsgId?: number) {
  // Clean up any stale in-memory session for this user
  const existing = activeUserSessions.get(from.id);
  if (existing) {
    clearTimeout(existing.timer);
    if (existing.checkInterval) clearInterval(existing.checkInterval);
    activeUserSessions.delete(from.id);
  }

  // Expire any existing active codes in Supabase
  try {
    await supabase
      .from('telegram_auth_codes')
      .update({ used: true })
      .eq('telegram_id', from.id)
      .eq('used', false);
  } catch (e) {
    console.error('[Bot] Expire existing codes error:', e);
  }

  // 1. Remove reply keyboard so "Kirish kodini olish" button vanishes for user
  const removeMsg = await sendTelegramMessage(chatId, '⏳', { remove_keyboard: true });
  if (removeMsg?.result?.message_id) {
    await deleteTelegramMessage(chatId, removeMsg.result.message_id);
  }

  // 2. Generate 6-digit code with 3 min expiration
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAtMs = Date.now() + 3 * 60 * 1000;
  const expiresAt = new Date(expiresAtMs).toISOString();

  console.log(`[Bot] Generating code for ${fullName} (${phoneNumber}): ${code}`);

  const { data: inserted, error } = await supabase
    .from('telegram_auth_codes')
    .insert([
      {
        code,
        telegram_id: from.id,
        phone_number: phoneNumber,
        first_name: from.first_name,
        last_name: from.last_name || '',
        username: from.username || '',
        expires_at: expiresAt,
        used: false
      }
    ])
    .select()
    .single();

  if (error || !inserted) {
    console.error('[Bot] Supabase insert error:', error);
    await sendTelegramMessage(chatId, `⚠️ Xatolik yuz berdi. Iltimos qayta urinib ko‘ring.`, {
      keyboard: [[{ text: '🔑 Kirish kodini olish' }]],
      resize_keyboard: true
    });
    return;
  }

  // 3. Send code message with inline button: "🌐 Saytga kirish" -> https://lexis.uz/login
  const sentMsg = await sendTelegramMessage(
    chatId,
    `🔐 <b>Sizning bir martalik tasdiqlash kodingiz:</b>\n\n<code>${code}</code>\n\n⏳ Ushbu kod <b>3 daqiqa</b> davomida amal qiladi.`,
    {
      inline_keyboard: [
        [
          {
            text: '🌐 Saytga kirish',
            url: 'https://lexis.uz/login'
          }
        ]
      ]
    }
  );

  const botMessageIds: number[] = [];
  if (sentMsg?.result?.message_id) {
    botMessageIds.push(sentMsg.result.message_id);
  }

  const userMessageIds: number[] = [];
  if (incomingMsgId) {
    userMessageIds.push(incomingMsgId);
  }

  const session: ActiveSession = {
    code,
    codeRecordId: inserted.id,
    chatId,
    telegramId: from.id,
    expiresAt: expiresAtMs,
    botMessageIds,
    userMessageIds,
    timer: null as any,
    checkInterval: null as any
  };

  // 4. Timer: Expiry at 3 minutes
  const timeoutMs = Math.max(1000, expiresAtMs - Date.now());
  session.timer = setTimeout(async () => {
    try {
      const { data } = await supabase
        .from('telegram_auth_codes')
        .select('used')
        .eq('id', inserted.id)
        .maybeSingle();

      if (data && data.used) {
        await endSession(session, 'used');
      } else {
        await supabase
          .from('telegram_auth_codes')
          .update({ used: true })
          .eq('id', inserted.id);

        await endSession(session, 'expired');
      }
    } catch (err) {
      console.error('[Bot] Expiry timer error:', err);
    }
  }, timeoutMs);

  // 5. Polling Interval: Detect login on website immediately (every 2 seconds)
  session.checkInterval = setInterval(async () => {
    try {
      const { data } = await supabase
        .from('telegram_auth_codes')
        .select('used')
        .eq('id', inserted.id)
        .maybeSingle();

      if (data && data.used) {
        await endSession(session, 'used');
      }
    } catch (err) {
      console.error('[Bot] Interval check error:', err);
    }
  }, 2000);

  activeUserSessions.set(from.id, session);
}

async function pollUpdates() {
  try {
    const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();

    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    }
  } catch (err) {
    console.error('[Bot] Polling error:', err);
    await new Promise((r) => setTimeout(r, 2000));
  }

  setImmediate(pollUpdates);
}

console.log('🤖 LEXIS 4000 Telegram Auth Bot (@lexis4000_bot) is active with auto-cleanup & clean URL...');
pollUpdates();
