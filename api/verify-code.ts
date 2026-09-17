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

function calculateDaysBetween(fromDateStr: string, toDateStr: string): number {
  const [y1, m1, d1] = fromDateStr.split('-').map(Number);
  const [y2, m2, d2] = toDateStr.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / msPerDay);
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code } = req.body || {};
  const cleanCode = (code || '').toString().trim();

  if (!cleanCode || cleanCode.length !== 6) {
    return res.status(400).json({ error: '6 xonali kod kiritilishi shart.' });
  }

  const nowIso = new Date().toISOString();

  try {
    // 1. Find active unused code
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
      return res.status(400).json({ error: 'Kod noto‘g‘ri yoki muddati tugagan. Botdan yangi kod oling.' });
    }

    // 2. Mark code as used
    await supabase
      .from('telegram_auth_codes')
      .update({ used: true })
      .eq('id', codeRecord.id);

    // 3. Find or create user profile
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', codeRecord.telegram_id)
      .maybeSingle();

    const todayStr = getLocalDateString();
    let finalProfile: any;

    if (existingUser) {
      // Calculate streak
      let prevDate: string | null = null;
      if (existingUser.last_study_date) {
        prevDate = existingUser.last_study_date.includes('T')
          ? getLocalDateString(new Date(existingUser.last_study_date))
          : existingUser.last_study_date;
      } else if (existingUser.created_at) {
        prevDate = getLocalDateString(new Date(existingUser.created_at));
      }

      let newStreak = existingUser.streak_days || 1;
      let shouldUpdateStreak = !existingUser.last_study_date;

      if (prevDate) {
        const diff = calculateDaysBetween(prevDate, todayStr);
        if (diff === 1) {
          newStreak = (existingUser.streak_days || 1) + 1;
          shouldUpdateStreak = true;
        } else if (diff > 1) {
          newStreak = 1;
          shouldUpdateStreak = true;
        }
      }

      if (shouldUpdateStreak) {
        const { data: updated } = await supabase
          .from('profiles')
          .update({
            streak_days: newStreak,
            last_study_date: todayStr
          })
          .eq('id', existingUser.id)
          .select()
          .maybeSingle();
        finalProfile = updated || { ...existingUser, streak_days: newStreak, last_study_date: todayStr };
      } else {
        finalProfile = existingUser;
      }
    } else {
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
        return res.status(500).json({ error: 'Profil yaratishda xatolik yuz berdi.' });
      }
      finalProfile = newUser;
    }

    // 4. Notify Telegram bot in background (delete messages & send congratulations)
    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
    if (token && codeRecord.telegram_id) {
      const api = `https://api.telegram.org/bot${token}`;

      // Extract message IDs to delete
      const toDelete = new Set<number>();
      if (codeRecord.last_name) {
        const rawMsgPart = codeRecord.last_name.split('|')[0];
        if (rawMsgPart.startsWith('msg_')) {
          const parts = rawMsgPart.replace('msg_', '').split('_');
          for (const p of parts) {
            const n = parseInt(p, 10);
            if (!isNaN(n) && n > 0) toDelete.add(n);
          }
        }
      }

      // Execute deletions
      for (const mId of toDelete) {
        fetch(`${api}/deleteMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: codeRecord.telegram_id, message_id: mId })
        }).catch(() => {});
      }

      // Send congratulations
      fetch(`${api}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: codeRecord.telegram_id,
          text: '🎉 <b>Tizimga kirganingiz bilan tabriklaymiz!</b>\n\nBarcha darslar va shaxsiy o‘rganish rejangiz platformada faollashtirildi.',
          parse_mode: 'HTML',
          reply_markup: {
            keyboard: [[{ text: '🔑 Kirish kodini olish' }]],
            resize_keyboard: true
          }
        })
      }).catch(() => {});
    }

    // Extract user goal from auth record if present
    let userGoal: { track?: string; target?: string; daily?: string } | null = null;
    if (codeRecord.last_name && codeRecord.last_name.includes('|goal:')) {
      const goalPart = codeRecord.last_name.split('|goal:')[1];
      if (goalPart) {
        const [track, target, daily] = goalPart.split('_');
        userGoal = { track, target, daily };
      }
    }

    return res.status(200).json({ ok: true, profile: finalProfile, goal: userGoal });
  } catch (err: any) {
    console.error('[verify-code] Error:', err);
    return res.status(500).json({ error: 'Ichki server xatoligi.' });
  }
}
