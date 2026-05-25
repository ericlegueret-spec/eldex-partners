const https = require('https');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const data = JSON.stringify(payload);

  return new Promise((resolve) => {
    const options = {
      hostname: 'hook.eu2.make.com',
      path: '/au64jug7xs6q7tvp5k58pge2ieht1dax',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      resolve({
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, status: res.statusCode })
      });
    });

    req.on('error', (err) => {
      console.error('make-notify error:', err);
      resolve({
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to notify Make' })
      });
    });

    req.write(data);
    req.end();
  });
};
