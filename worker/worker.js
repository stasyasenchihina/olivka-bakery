// Cloudflare Worker: принимает заявку с сайта и отправляет её в Telegram.
// Секреты (wrangler secret put): BOT_TOKEN, CHAT_ID. Переменная: ALLOWED_ORIGIN (адрес сайта).

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    // ALLOWED_ORIGIN: один адрес сайта или несколько через запятую
    const list = (env.ALLOWED_ORIGIN || '').split(',').map((x) => x.trim()).filter(Boolean);
    const allow = list.length === 0 ? '*' : list.includes(origin) ? origin : list[0];
    const cors = {
      'Access-Control-Allow-Origin': allow,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
    if (list.length && !list.includes(origin)) return json({ ok: false, error: 'origin' }, 403);

    let d;
    try { d = await req.json(); } catch { return json({ ok: false, error: 'json' }, 400); }

    if (d.website) return json({ ok: true }); // honeypot: боты заполняют скрытое поле

    const name = String(d.name || '').trim().slice(0, 80);
    const phone = String(d.phone || '').trim().slice(0, 30);
    const date = String(d.date || '').slice(0, 10);
    const time = String(d.time || '').slice(0, 5);
    const comment = String(d.comment || '').trim().slice(0, 500);
    const items = Array.isArray(d.items) ? d.items.slice(0, 60).map((x) => String(x).slice(0, 60)) : [];

    if (name.length < 2 || phone.replace(/\D/g, '').length < 10 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return json({ ok: false, error: 'validation' }, 400);
    }

    const text = [
      '🫒 <b>Новый предзаказ</b>',
      `👤 ${esc(name)}`,
      `📞 ${esc(phone)}`,
      `🕒 ${esc(date.split('-').reverse().join('.'))} к ${esc(time)}`,
      `🧺 ${items.length ? items.map(esc).join(', ') : 'позиции не выбраны'}`,
      comment ? `💬 ${esc(comment)}` : ''
    ].filter(Boolean).join('\n');

    const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: 'HTML' })
    });
    return r.ok ? json({ ok: true }) : json({ ok: false, error: 'telegram' }, 502);
  }
};
