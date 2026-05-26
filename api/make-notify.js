const nodemailer = require('nodemailer');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const payload = req.body;
  const { nom, email, telephone, message, rapport, score, secteur, source, date } = payload;

  const GMAIL_USER = 'ericlegueret@gmail.com';
  const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_PASS) return res.status(500).json({ error: 'GMAIL_APP_PASSWORD not configured' });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
  });

  const isContact = !score;
  const notifSubject = isContact ? `🔔 Nouveau contact — ${nom} (${email})` : `📊 Diagnostic — ${nom} · ${score}/100`;

  const notifHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#F8F7F4;padding:24px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E0D8CC;">
  <div style="background:#1B2A4A;padding:20px 28px;">
    <h2 style="color:#fff;margin:0;font-size:18px;">${isContact ? '🔔 Nouveau contact' : '📊 Diagnostic'} — ${nom}</h2>
    <p style="color:#C9A84C;margin:4px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;">${source || 'ELDEX Partners'}</p>
  </div>
  <div style="padding:28px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #F0EDE6;color:#6B7890;font-size:13px;width:35%;">👤 Nom</td><td style="padding:8px 0;border-bottom:1px solid #F0EDE6;color:#1B2A4A;font-weight:700;">${nom||'—'}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #F0EDE6;color:#6B7890;font-size:13px;">📧 Email</td><td style="padding:8px 0;border-bottom:1px solid #F0EDE6;color:#1B2A4A;font-weight:600;">${email||'—'}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #F0EDE6;color:#6B7890;font-size:13px;">📱 Téléphone</td><td style="padding:8px 0;border-bottom:1px solid #F0EDE6;color:#1B2A4A;">${telephone||'—'}</td></tr>
      ${score ? `<tr><td style="padding:8px 0;border-bottom:1px solid #F0EDE6;color:#6B7890;font-size:13px;">🎯 Score</td><td style="padding:8px 0;border-bottom:1px solid #F0EDE6;color:#1B2A4A;font-weight:700;">${score}/100</td></tr>` : ''}
      ${secteur ? `<tr><td style="padding:8px 0;border-bottom:1px solid #F0EDE6;color:#6B7890;font-size:13px;">🏭 Secteur</td><td style="padding:8px 0;border-bottom:1px solid #F0EDE6;color:#1B2A4A;">${secteur}</td></tr>` : ''}
      <tr><td style="padding:8px 0;color:#6B7890;font-size:13px;">💬 ${score ? 'Rapport' : 'Message'}</td><td style="padding:8px 0;color:#1B2A4A;font-size:13px;">${message||rapport||'—'}</td></tr>
    </table>
    <div style="text-align:center;margin-top:24px;">
      <a href="mailto:${email}" style="display:inline-block;background:#1B2A4A;color:#fff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:8px;text-decoration:none;">Répondre à ${nom} →</a>
    </div>
  </div>
</div>
</body></html>`;

  const confirmHtml = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F0EDE6;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div style="background:#1B2A4A;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Message bien reçu ✅</h1>
    <p style="color:#C9A84C;margin:8px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Eric Leguéret — Directeur Digital Externalisé</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #E0D8CC;border-top:none;">
    <p style="color:#1B2A4A;font-size:16px;line-height:1.7;">Bonjour <strong>${nom}</strong>,</p>
    <p style="color:#6B7890;font-size:15px;line-height:1.7;">Votre message a bien été reçu. Je reviens vers vous <strong style="color:#1B2A4A;">sous 24h</strong>.</p>
    ${message ? `<div style="background:#F8F7F4;border-left:4px solid #C9A84C;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;"><p style="color:#1B2A4A;font-size:13px;font-weight:700;margin:0 0 4px;">Votre message</p><p style="color:#6B7890;font-size:14px;font-style:italic;margin:0;">${message}</p></div>` : ''}
    ${score ? `<div style="background:#F8F7F4;border-left:4px solid #C9A84C;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;"><p style="color:#1B2A4A;font-size:28px;font-weight:700;margin:0;">${score}<span style="font-size:14px;color:#C9A84C;">/100</span></p><p style="color:#6B7890;font-size:13px;margin:4px 0 0;">Score de maturité digitale</p></div>` : ''}
    <div style="text-align:center;margin-top:24px;">
      <a href="https://www.ericlegueret.com/appointment-calendar" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#E8C96A);color:#1B2A4A;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">Réserver un créneau →</a>
      <p style="font-size:12px;color:#A8B0C0;margin-top:8px;">Gratuit · Sans engagement · 30 minutes</p>
    </div>
  </div>
  <div style="background:#1B2A4A;border-radius:0 0 12px 12px;padding:16px 32px;">
    <p style="color:#fff;font-size:13px;font-weight:700;margin:0;">Eric Leguéret — Directeur Digital Externalisé · Lille</p>
  </div>
</div>
</body></html>`;

  try {
    await transporter.sendMail({ from: `"ELDEX Partners" <${GMAIL_USER}>`, to: GMAIL_USER, subject: notifSubject, html: notifHtml });
    if (email && email.includes('@')) {
      await transporter.sendMail({ from: `"Eric Leguéret" <${GMAIL_USER}>`, to: email, subject: isContact ? '✅ Message reçu — Eric Leguéret vous répond sous 24h' : `📊 Votre diagnostic digital — Score ${score}/100`, html: confirmHtml });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: err.message });
  }
};
