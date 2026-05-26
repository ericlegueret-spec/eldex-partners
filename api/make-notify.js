const nodemailer = require('nodemailer');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const payload = req.body || {};
  const { nom, email, telephone, message, rapport, score, secteur, source } = payload;

  const GMAIL_USER = 'ericlegueret@gmail.com';
  const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

  // DEBUG — log env var presence
  console.log('GMAIL_PASS present:', !!GMAIL_PASS, '| length:', GMAIL_PASS ? GMAIL_PASS.length : 0);
  console.log('Payload:', JSON.stringify({ nom, email, score, source }));

  if (!GMAIL_PASS) {
    console.error('ERROR: GMAIL_APP_PASSWORD not set');
    return res.status(500).json({ error: 'GMAIL_APP_PASSWORD not configured' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
  });

  const isContact = !score;
  const subject = isContact
    ? `🔔 Nouveau contact — ${nom||'?'} (${email||'?'})`
    : `📊 Diagnostic — ${nom||'?'} · ${score}/100`;

  try {
    console.log('Sending email to:', GMAIL_USER);
    const result = await transporter.sendMail({
      from: `"ELDEX Partners" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      subject,
      html: `<p><b>Nom:</b> ${nom||'—'}</p><p><b>Email:</b> ${email||'—'}</p><p><b>Tel:</b> ${telephone||'—'}</p><p><b>Message:</b> ${message||rapport||'—'}</p><p><b>Score:</b> ${score||'—'}</p><p><b>Secteur:</b> ${secteur||'—'}</p><p><b>Source:</b> ${source||'—'}</p>`
    });
    console.log('Email sent! MessageId:', result.messageId);

    if (email && email.includes('@') && email !== GMAIL_USER) {
      await transporter.sendMail({
        from: `"Eric Leguéret" <${GMAIL_USER}>`,
        to: email,
        subject: '✅ Message reçu — Eric Leguéret vous répond sous 24h',
        html: `<p>Bonjour ${nom||''},</p><p>Votre message a bien été reçu. Je reviens vers vous sous 24h.</p><p><a href="https://www.ericlegueret.com/appointment-calendar">Réserver un créneau →</a></p><p>Eric Leguéret</p>`
      });
    }

    return res.status(200).json({ success: true, messageId: result.messageId });
  } catch (err) {
    console.error('Email error:', err.message, err.code);
    return res.status(500).json({ error: err.message, code: err.code });
  }
};
