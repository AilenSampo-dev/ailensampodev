// Vercel Serverless Function — guarda el email como contacto en Brevo.
// Requiere las variables de entorno BREVO_API_KEY y BREVO_LIST_ID en Vercel.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel parsea el body JSON automáticamente; este fallback cubre otros casos.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const email = (body && body.email ? String(body.email) : '').trim();

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;
  if (!apiKey || !listId) {
    return res.status(500).json({ error: 'Falta configurar BREVO_API_KEY / BREVO_LIST_ID' });
  }

  try {
    const r = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        email,
        listIds: [Number(listId)],
        updateEnabled: true
      })
    });

    // 201 = contacto nuevo creado
    if (r.status === 201) {
      return res.status(200).json({ ok: true, already: false });
    }
    // 204 = el contacto ya existía (Brevo lo actualiza)
    if (r.status === 204) {
      return res.status(200).json({ ok: true, already: true });
    }

    const data = await r.json().catch(() => ({}));
    // Si el contacto ya existía, también lo tratamos como "ya suscripto".
    if (data && data.code === 'duplicate_parameter') {
      return res.status(200).json({ ok: true, already: true });
    }

    return res.status(502).json({ error: 'Brevo error', detail: data });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
