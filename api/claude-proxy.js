const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ANTHROPIC_API_KEY = (process.env.ANTHROPIC_API_KEY || '').trim().replace(/[\r\n\t]/g, '');
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const body = req.body || {};
  const data = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: body.messages || []
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const request = https.request(options, (response) => {
      let responseData = '';
      response.on('data', (chunk) => { responseData += chunk; });
      response.on('end', () => {
        try {
          res.status(200).json(JSON.parse(responseData));
        } catch(e) {
          res.status(500).json({ error: 'Parse error', raw: responseData.substring(0, 200) });
        }
        resolve();
      });
    });

    request.on('error', (err) => {
      console.error('claude-proxy error:', err.message);
      res.status(500).json({ error: err.message });
      resolve();
    });

    request.write(data);
    request.end();
  });
};
