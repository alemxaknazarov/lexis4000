export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { telegram_id, message_id } = req.body || {};
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || !telegram_id) {
    return res.status(400).json({ error: 'Missing token or telegram_id' });
  }

  const api = `https://api.telegram.org/bot${token}`;

  try {
    // Delete the temporary code message if message_id is provided
    if (message_id) {
      await fetch(`${api}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegram_id,
          message_id
        })
      }).catch(() => {});
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

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[notify-login] Error:', err);
    return res.status(200).json({ ok: true });
  }
}
