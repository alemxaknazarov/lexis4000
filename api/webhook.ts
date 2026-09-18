import { createClient } from '@supabase/supabase-js';

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
    return await res.json();
  } catch (err) {
    console.error('[Webhook] Failed to send telegram message:', err);
    return null;
  }
}

async function editTelegramMessage(chatId: number, messageId: number, text: string, replyMarkup?: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });
    return await res.json();
  } catch (err) {
    console.error('[Webhook] Failed to edit telegram message:', err);
    return null;
  }
}

async function answerTelegramCallback(callbackQueryId: string, text?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text || ''
      })
    });
    return await res.json();
  } catch (err) {
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

// Feature Flag & Admin Whitelist for safe production testing
const ADMIN_IDS = [1102377043];
const IS_ONBOARDING_PUBLIC = false; // When Boss approves, set to true to enable for everyone!

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      service: 'LEXIS 4000 Telegram Webhook v2',
      onboarding_public: IS_ONBOARDING_PUBLIC,
      admins: ADMIN_IDS
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const update = req.body;
  if (!update) {
    return res.status(200).json({ ok: true });
  }

  const nowIso = new Date().toISOString();

  try {
    // ==========================================
    // A. HANDLE INLINE BUTTON CALLBACK QUERIES
    // ==========================================
    if (update.callback_query) {
      const cq = update.callback_query;
      const data = cq.data || '';
      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;
      const from = cq.from;

      await answerTelegramCallback(cq.id);

      if (!chatId || !messageId) {
        return res.status(200).json({ ok: true });
      }

      // 1. Start onboarding
      if (data === 'cb_start_onboarding') {
        await editTelegramMessage(
          chatId,
          messageId,
          `Assalomu alaykum, <b>${from.first_name}</b>!\n\n` +
          `Siz uchun eng mos va samarali shaxsiy ta’lim rejasini tuzamiz:\n\n` +
          `<b>1-savol:</b> Asosiy maqsadingiz qaysi yo‘nalish?`,
          {
            inline_keyboard: [
              [{ text: '🎓 CEFR (A1 — C1)', callback_data: 'cb_track:cefr' }],
              [{ text: '🎯 IELTS (Band 9)', callback_data: 'cb_track:ielts' }],
              [{ text: '🗣 Umumiy Ingliz tili', callback_data: 'cb_track:general' }]
            ]
          }
        );
        return res.status(200).json({ ok: true });
      }

      // 2. Track selected -> Ask Target Level
      if (data.startsWith('cb_track:')) {
        const track = data.split(':')[1];

        if (track === 'cefr') {
          await editTelegramMessage(
            chatId,
            messageId,
            `🎓 <b>CEFR yo‘nalishi tanlandi.</b>\n\n` +
            `<b>2-savol:</b> Qaysi darajani egallashni maqsad qildingiz?`,
            {
              inline_keyboard: [
                [{ text: 'A2 (Elementary)', callback_data: 'cb_target:cefr:A2' }],
                [{ text: 'B1 (Pre-Intermediate)', callback_data: 'cb_target:cefr:B1' }],
                [{ text: 'B2 (Upper-Intermediate)', callback_data: 'cb_target:cefr:B2' }],
                [{ text: 'C1 (Academic Mastery)', callback_data: 'cb_target:cefr:C1' }]
              ]
            }
          );
        } else if (track === 'ielts') {
          await editTelegramMessage(
            chatId,
            messageId,
            `🎯 <b>IELTS yo‘nalishi tanlandi.</b>\n\n` +
            `<b>2-savol:</b> IELTS bo‘yicha maqsad ballingiz qanday?`,
            {
              inline_keyboard: [
                [
                  { text: 'Band 6.0', callback_data: 'cb_target:ielts:6.0' },
                  { text: 'Band 6.5', callback_data: 'cb_target:ielts:6.5' }
                ],
                [
                  { text: 'Band 7.0', callback_data: 'cb_target:ielts:7.0' },
                  { text: 'Band 7.5', callback_data: 'cb_target:ielts:7.5' }
                ],
                [
                  { text: 'Band 8.0+', callback_data: 'cb_target:ielts:8.0' }
                ]
              ]
            }
          );
        } else {
          await editTelegramMessage(
            chatId,
            messageId,
            `🗣 <b>Umumiy Ingliz tili tanlandi.</b>\n\n` +
            `<b>2-savol:</b> Lug‘at boyligingizni qancha so‘zga yetkazmoqchisiz?`,
            {
              inline_keyboard: [
                [{ text: '1000 ta so‘z (Kundalik so‘zlashuv)', callback_data: 'cb_target:general:1000' }],
                [{ text: '2000 ta so‘z (Erkin muloqot)', callback_data: 'cb_target:general:2000' }],
                [{ text: '4000 ta so‘z (Barcha 6 kitob)', callback_data: 'cb_target:general:4000' }]
              ]
            }
          );
        }
        return res.status(200).json({ ok: true });
      }

      // 3. Target Level selected -> Ask Daily Capacity (1 word = 1 XP)
      if (data.startsWith('cb_target:')) {
        const parts = data.split(':');
        const track = parts[1];
        const target = parts[2];

        await editTelegramMessage(
          chatId,
          messageId,
          `✅ Maqsad: <b>${track.toUpperCase()} ${target}</b>\n\n` +
          `<b>3-savol:</b> Kuniga nechta so‘z yodlashni rejalashtirasiz?\n` +
          `<i>(Qoida: LEXIS 4000 da 1 ta so‘z = 1 XP)</i>`,
          {
            inline_keyboard: [
              [{ text: '⚡️ 10 ta so‘z (10 XP • Yengil • ~10 daqiqa)', callback_data: `cb_daily:${track}:${target}:10` }],
              [{ text: '🔥 20 ta so‘z (20 XP • 1 unit • Standart)', callback_data: `cb_daily:${track}:${target}:20` }],
              [{ text: '🚀 40 ta so‘z (40 XP • 2 unit • Intensiv)', callback_data: `cb_daily:${track}:${target}:40` }]
            ]
          }
        );
        return res.status(200).json({ ok: true });
      }

      // 4. Daily Capacity selected -> Show Summary & Get Code Button
      if (data.startsWith('cb_daily:')) {
        const parts = data.split(':');
        const track = parts[1];
        const target = parts[2];
        const daily = parts[3];

        const trackTitle = track === 'ielts' ? 'IELTS' : track === 'cefr' ? 'CEFR' : 'Umumiy leksika';
        const goalMeta = `${track}_${target}_${daily}`;

        // Save goal anchor in database immediately so it persists forever
        try {
          await supabase.from('telegram_auth_codes').insert([{
            code: '000000',
            telegram_id: from.id,
            phone_number: '',
            first_name: from.first_name || '',
            last_name: `anchor|goal:${goalMeta}`,
            username: from.username || '',
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            used: true
          }]);
        } catch (_) {}

        await editTelegramMessage(
          chatId,
          messageId,
          `🎉 <b>Ajoyib, shaxsiy ta’lim rejangiz muvaffaqiyatli tuzildi!</b>\n\n` +
          `🎯 Yo‘nalish: <b>${trackTitle}</b>\n` +
          `🏆 Maqsad daraja: <b>${target}</b>\n` +
          `⚡️ Kunlik reja: <b>${daily} ta so‘z (${daily} XP)</b>\n\n` +
          `Barcha parametrlar profilingizga biriktirildi. Platformaga kirish uchun quyidagi tugmani bosing:`,
          {
            inline_keyboard: [
              [
                {
                  text: '🔑 Kirish kodini olish',
                  callback_data: `cb_code:${track}:${target}:${daily}`
                }
              ]
            ]
          }
        );

        // Also restore main reply keyboard
        await sendTelegramMessage(chatId, 'Pastdagi menyu orqali ham istalgan payt kod olishingiz mumkin:', {
          keyboard: [[{ text: '🔑 Kirish kodini olish' }]],
          resize_keyboard: true
        });

        return res.status(200).json({ ok: true });
      }

      // 5. Generate Code from callback
      if (data.startsWith('cb_code:')) {
        const parts = data.split(':');
        const track = parts[1];
        const target = parts[2];
        const daily = parts[3];

        const goalMeta = `${track}_${target}_${daily}`;
        await generateAndSendCode(chatId, from, '', from.first_name || 'O‘quvchi', messageId, goalMeta);
        return res.status(200).json({ ok: true });
      }

      return res.status(200).json({ ok: true });
    }

    // ==========================================
    // B. HANDLE STANDARD MESSAGES
    // ==========================================
    if (!update.message) {
      return res.status(200).json({ ok: true });
    }

    const msg = update.message;
    const chatId = msg.chat.id;
    const from = msg.from;
    const text = msg.text?.trim() || '';

    // 1. Fetch user profile
    let userProfile: any = null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', from.id)
      .maybeSingle();
    userProfile = profile;

    // 2. Check and clean up expired unused codes
    const { data: expiredCodes } = await supabase
      .from('telegram_auth_codes')
      .select('*')
      .eq('telegram_id', from.id)
      .eq('used', false)
      .lte('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1);

    if (expiredCodes && expiredCodes.length > 0) {
      await supabase
        .from('telegram_auth_codes')
        .update({ used: true })
        .eq('id', expiredCodes[0].id);

      if (expiredCodes[0].last_name && expiredCodes[0].last_name.startsWith('msg_')) {
        const rawIds = expiredCodes[0].last_name.split('|')[0].replace('msg_', '').split('_').map(Number).filter(Boolean);
        for (const mId of rawIds) {
          await deleteTelegramMessage(chatId, mId);
        }
      }

      await sendTelegramMessage(
        chatId,
        `❌ <b>Kod ishlatilmadi</b> (3 daqiqalik muddati tugadi).\n\nYangi kod olish uchun pastdagi tugmani bosing:`,
        {
          keyboard: [[{ text: '🔑 Kirish kodini olish' }]],
          resize_keyboard: true
        }
      );
    }

    // 3. Handle Contact Sharing (First-time registration -> Start Onboarding)
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
              streak_days: 1,
              last_study_date: new Date().toLocaleDateString('en-CA')
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

      const isAdmin = ADMIN_IDS.includes(from.id);
      const shouldShowOnboarding = IS_ONBOARDING_PUBLIC || isAdmin;

      if (shouldShowOnboarding) {
        // Start onboarding questions
        await sendTelegramMessage(
          chatId,
          `Assalomu alaykum, <b>${fullName}</b>!\n\n` +
          `<b>LEXIS 4000</b> platformasiga xush kelibsiz! 🚀\n\n` +
          `Siz uchun eng mos va samarali shaxsiy ta’lim rejasini tuzishimiz uchun 3 ta qisqa savolga javob bering:\n\n` +
          `<b>1-savol:</b> Asosiy maqsadingiz qaysi yo‘nalish?`,
          {
            inline_keyboard: [
              [{ text: '🎓 CEFR (A1 — C1)', callback_data: 'cb_track:cefr' }],
              [{ text: '🎯 IELTS (Band 9)', callback_data: 'cb_track:ielts' }],
              [{ text: '🗣 Umumiy Ingliz tili', callback_data: 'cb_track:general' }]
            ]
          }
        );
      } else {
        // Regular production users get their code immediately without friction
        await generateAndSendCode(chatId, from, phoneNumber, fullName, msg.message_id);
      }
      return res.status(200).json({ ok: true });
    }

    // 4. Check for active unexpired code
    const { data: activeCodes } = await supabase
      .from('telegram_auth_codes')
      .select('*')
      .eq('telegram_id', from.id)
      .eq('used', false)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1);

    const activeCode = activeCodes && activeCodes.length > 0 ? activeCodes[0] : null;

    if (activeCode && (text === '🔑 Kirish kodini olish' || text === '/code' || text === '/login')) {
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

    // 5. Handle "🔑 Kirish kodini olish" button
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

      await generateAndSendCode(chatId, from, userProfile.phone_number || '', userProfile.full_name, msg.message_id);
      return res.status(200).json({ ok: true });
    }

    // 6. Handle /id command
    if (text === '/id' || text === '/myid') {
      await sendTelegramMessage(chatId, `🆔 Sizning Telegram ID: <code>${from.id}</code>`);
      return res.status(200).json({ ok: true });
    }

    // 7. Handle /test, /beta, /onboarding or /goals
    if (
      text === '/test' || 
      text === '/beta' || 
      text === '/onboarding' || 
      text === '/goals' || 
      text === '🎯 Maqsadni o‘zgartirish'
    ) {
      await sendTelegramMessage(
        chatId,
        `Assalomu alaykum, <b>${from.first_name}</b>!\n\n` +
        `🚀 <b>LEXIS 4000: Shaxsiy Ta’lim Rejasini Sinash (Beta Mode)</b>\n\n` +
        `<b>1-savol:</b> Asosiy maqsadingiz qaysi yo‘nalish?`,
        {
          inline_keyboard: [
            [{ text: '🎓 CEFR (A1 — C1)', callback_data: 'cb_track:cefr' }],
            [{ text: '🎯 IELTS (Band 9)', callback_data: 'cb_track:ielts' }],
            [{ text: '🗣 Umumiy Ingliz tili', callback_data: 'cb_track:general' }]
          ]
        }
      );
      return res.status(200).json({ ok: true });
    }

    // 7. Default Greeting
    if (userProfile) {
      await sendTelegramMessage(
        chatId,
        `Assalomu alaykum, <b>${userProfile.full_name || from.first_name}</b>!\n\n` +
        `Saytga kirish uchun quyidagi <b>«🔑 Kirish kodini olish»</b> tugmasini bosing:`,
        {
          keyboard: [[{ text: '🔑 Kirish kodini olish' }]],
          resize_keyboard: true
        }
      );
    } else {
      await sendTelegramMessage(
        chatId,
        `Assalomu alaykum, <b>${from.first_name || 'Qadrdon o‘quvchi'}</b>!\n\n` +
        `<b>LEXIS 4000</b> platformasiga xush kelibsiz.\n\n` +
        `Bir martalik ro‘yxatdan o‘tish va shaxsiy ta’lim rejangizni tuzish uchun <b>«📱 Telefon raqamni yuborish»</b> tugmasini bosing:`,
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

async function generateAndSendCode(
  chatId: number, 
  from: any, 
  phoneNumber: string, 
  _fullName: string, 
  userMsgId?: number, 
  goalMeta?: string
) {
  // 1. Clean up any previous unexpired codes in chat
  try {
    const { data: prevCodes } = await supabase
      .from('telegram_auth_codes')
      .select('id, last_name')
      .eq('telegram_id', from.id)
      .eq('used', false);

    if (prevCodes && prevCodes.length > 0) {
      for (const pc of prevCodes) {
        if (pc.last_name && pc.last_name.startsWith('msg_')) {
          const rawPart = pc.last_name.split('|')[0];
          const ids = rawPart.replace('msg_', '').split('_').map(Number).filter(Boolean);
          for (const mId of ids) {
            await deleteTelegramMessage(chatId, mId);
          }
        }
      }
      await supabase
        .from('telegram_auth_codes')
        .update({ used: true })
        .eq('telegram_id', from.id)
        .eq('used', false);
    }
  } catch (_) {}

  // 2. Fetch phone if empty
  let userPhone = phoneNumber;
  if (!userPhone) {
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('telegram_id', from.id)
        .maybeSingle();
      if (prof?.phone_number) {
        userPhone = prof.phone_number;
      }
    } catch (_) {}
  }

  // 3. Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAtMs = Date.now() + 3 * 60 * 1000;
  const expiresAt = new Date(expiresAtMs).toISOString();

  // 4. Send code message with inline button
  const sentMsg = await sendTelegramMessage(
    chatId,
    `🔐 <b>Sizning bir martalik tasdiqlash kodingiz:</b>\n\n` +
    `<code>${code}</code>\n\n` +
    `⏳ Ushbu kod <b>3 daqiqa</b> davomida amal qiladi.`,
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
  const msgIds: number[] = [];
  if (sentMessageId) msgIds.push(sentMessageId);
  if (userMsgId) msgIds.push(userMsgId);

  // If goalMeta not passed directly, fetch user's latest saved goal
  let finalGoalMeta = goalMeta;
  if (!finalGoalMeta) {
    try {
      const { data: latestAnchor } = await supabase
        .from('telegram_auth_codes')
        .select('last_name')
        .eq('telegram_id', from.id)
        .like('last_name', '%|goal:%')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestAnchor?.last_name && latestAnchor.last_name.includes('|goal:')) {
        finalGoalMeta = latestAnchor.last_name.split('|goal:')[1];
      }
    } catch (_) {}
  }

  let msgTracker = msgIds.length > 0 ? `msg_${msgIds.join('_')}` : '';
  if (finalGoalMeta) {
    msgTracker += `|goal:${finalGoalMeta}`;
  }

  // 5. Save into database
  await supabase
    .from('telegram_auth_codes')
    .insert([
      {
        code,
        telegram_id: from.id,
        phone_number: userPhone,
        first_name: from.first_name,
        last_name: msgTracker,
        username: from.username || '',
        expires_at: expiresAt,
        used: false
      }
    ]);
}
