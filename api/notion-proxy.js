const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  if (!NOTION_API_KEY) return res.status(500).json({ error: 'Notion API key not configured' });

  const { action, token, pageId } = req.body || {};
  const notionData = JSON.stringify(req.body || {});

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.notion.com',
      path: action === 'get_page' ? `/v1/pages/${pageId}` : '/v1/pages',
      method: req.method,
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        'Content-Length': Buffer.byteLength(notionData)
      }
    };

    const request = https.request(options, (response) => {
      let responseData = '';
      response.on('data', (chunk) => { responseData += chunk; });
      response.on('end', () => {
        try { res.status(response.statusCode).json(JSON.parse(responseData)); }
        catch(e) { res.status(200).send(responseData); }
        resolve();
      });
    });

    request.on('error', (err) => { res.status(500).json({ error: err.message }); resolve(); });
    request.write(notionData);
    request.end();
  });
};
