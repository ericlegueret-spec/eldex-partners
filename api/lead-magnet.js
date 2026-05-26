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

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  if (!NOTION_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Notion API key not configured' }) };
  }

  let email, source;
  try {
    const body = JSON.parse(event.body);
    email = (body.email || '').trim().toLowerCase();
    source = body.source || 'lead-magnet-5-outils';
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email invalide' }) };
  }

  try {
    // Stockage dans Notion DB Clients
    const notionResp = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: 'f5af7434-70b1-48a8-99df-a4acb2892daf' },
        properties: {
          'Nom': {
            title: [{ text: { content: email } }]
          },
          'Email': {
            email: email
          },
          'Statut': {
            select: { name: 'Lead' }
          },
          'Notes': {
            rich_text: [{ text: { content: `Source: ${source} — ${new Date().toLocaleDateString('fr-FR')}` } }]
          }
        }
      })
    });

    if (!notionResp.ok) {
      const err = await notionResp.text();
      console.error('Notion error:', err);
      // On continue quand même — on redirige vers le guide
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        redirect: 'https://eldex-partners.netlify.app/guide-5-outils-ia.html'
      })
    };

  } catch (err) {
    console.error('lead-magnet error:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        redirect: 'https://eldex-partners.netlify.app/guide-5-outils-ia.html'
      })
    };
  }
};
