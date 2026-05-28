const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Aggressive API key sanitization — remove ALL non-printable and non-ASCII chars
  const rawKey = process.env.ANTHROPIC_API_KEY || '';
  const ANTHROPIC_API_KEY = rawKey.replace(/[^\x20-\x7E]/g, '').trim();

  console.log('Key length:', ANTHROPIC_API_KEY.length, '| Starts with:', ANTHROPIC_API_KEY.substring(0, 8));

  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.length < 10) {
    console.error('Invalid API key');
    return res.status(500).json({ error: 'API key not configured or invalid' });
  }

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
        console.log('Anthropic status:', response.statusCode);
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.error) {
            console.error('Anthropic error:', parsed.error.type, parsed.error.message);
          }
          res.status(response.statusCode).json(parsed);
        } catch(e) {
          console.error('Parse error:', e.message);
          res.status(500).json({ error: 'Parse error', raw: responseData.substring(0, 200) });
        }
        resolve();
      });
    });

    request.on('error', (err) => {
      console.error('Request error:', err.code, err.message);
      res.status(500).json({ error: err.message, code: err.code });
      resolve();
    });

    request.write(data);
    request.end();
  });
};
