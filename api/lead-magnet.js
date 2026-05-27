const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, source } = req.body || {};
  const NOTION_API_KEY = process.env.NOTION_API_KEY;

  if (!email) return res.status(400).json({ error: 'Email requis' });

  if (NOTION_API_KEY) {
    const notionData = JSON.stringify({
      parent: { database_id: 'f5af7434-70b1-48a8-99df-a4acb2892daf' },
      properties: {
        Email: { title: [{ text: { content: email } }] },
        Source: { rich_text: [{ text: { content: source || 'lead-magnet' } }] },
        Date: { date: { start: new Date().toISOString() } }
      }
    });

    const notionOptions = {
      hostname: 'api.notion.com',
      path: '/v1/pages',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        'Content-Length': Buffer.byteLength(notionData)
      }
    };

    await new Promise((resolve) => {
      const req2 = https.request(notionOptions, (r) => { r.on('data', () => {}); r.on('end', resolve); });
      req2.on('error', resolve);
      req2.write(notionData);
      req2.end();
    });
  }

  return res.status(200).json({
    success: true,
    redirect: 'https://eldex-partners.vercel.app/guide-5-outils-ia.html'
  });
};
