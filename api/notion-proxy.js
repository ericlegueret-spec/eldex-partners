exports.handler = async function(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  if (!NOTION_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Notion API key not configured' }) };
  }

  try {
    const { action, payload } = JSON.parse(event.body);

    // ── Action: Chercher un client par token ──────────────────────────────
    if (action === 'find_client_by_token') {
      const { token } = payload;
      const resp = await fetch('https://api.notion.com/v1/databases/f5af7434-70b1-48a8-99df-a4acb2892daf/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            property: 'Token accès',
            rich_text: { equals: token }
          }
        })
      });
      const data = await resp.json();
      if (data.results && data.results.length > 0) {
        const page = data.results[0];
        const props = page.properties;
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            found: true,
            id: page.id,
            nom: props['Nom']?.title?.[0]?.plain_text || '',
            entreprise: props['Entreprise']?.rich_text?.[0]?.plain_text || '',
            email: props['Email']?.email || '',
            formule: props['Formule']?.select?.name || '',
            statut: props['Statut']?.select?.name || '',
            token: props['Token accès']?.rich_text?.[0]?.plain_text || ''
          })
        };
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ found: false })
      };
    }

    // ── Action: Récupérer les missions d'un client ────────────────────────
    if (action === 'get_missions') {
      const { client_id } = payload;
      const resp = await fetch('https://api.notion.com/v1/databases/3a00b2dc-9435-4232-b526-5fb2993bb6bf/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            property: 'Client',
            relation: { contains: client_id }
          }
        })
      });
      const data = await resp.json();
      const missions = (data.results || []).map(page => {
        const props = page.properties;
        return {
          id: page.id,
          titre: props['Titre mission']?.title?.[0]?.plain_text || '',
          statut: props['Statut']?.select?.name || '',
          avancement: props['Avancement']?.number || 0,
          prochaine_etape: props['Prochaine étape']?.rich_text?.[0]?.plain_text || '',
          date_debut: props['Date début']?.date?.start || null,
          date_fin: props['Date fin prévue']?.date?.start || null
        };
      });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ missions })
      };
    }

    // ── Action: Récupérer les livrables d'une mission ─────────────────────
    if (action === 'get_livrables') {
      const { mission_id } = payload;
      const resp = await fetch('https://api.notion.com/v1/databases/4787230c-07a3-4304-bf89-72a48d25a088/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            and: [
              { property: 'Mission', relation: { contains: mission_id } },
              { property: 'Visible client', checkbox: { equals: true } }
            ]
          }
        })
      });
      const data = await resp.json();
      const livrables = (data.results || []).map(page => {
        const props = page.properties;
        return {
          id: page.id,
          titre: props['Titre']?.title?.[0]?.plain_text || '',
          type: props['Type']?.select?.name || '',
          statut: props['Statut']?.select?.name || '',
          url: props['URL ou fichier']?.url || null,
          date: props['Date remise']?.date?.start || null,
          description: props['Description']?.rich_text?.[0]?.plain_text || ''
        };
      });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ livrables })
      };
    }

    // ── Action: Créer un client ───────────────────────────────────────────
    if (action === 'create_client') {
      const { nom, entreprise, email, telephone, formule, secteur, token } = payload;
      const resp = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parent: { database_id: 'f5af7434-70b1-48a8-99df-a4acb2892daf' },
          properties: {
            'Nom': { title: [{ text: { content: nom } }] },
            'Entreprise': { rich_text: [{ text: { content: entreprise } }] },
            'Email': { email: email },
            'Téléphone': { phone_number: telephone || '' },
            'Formule': { select: { name: formule } },
            'Secteur': { select: { name: secteur } },
            'Statut': { select: { name: 'Client actif' } },
            'Token accès': { rich_text: [{ text: { content: token } }] }
          }
        })
      });
      const data = await resp.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, id: data.id, token })
      };
    }

    // ── Action: Lister tous les clients (admin) ───────────────────────────
    if (action === 'list_clients') {
      const resp = await fetch('https://api.notion.com/v1/databases/f5af7434-70b1-48a8-99df-a4acb2892daf/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sorts: [{ property: 'Nom', direction: 'ascending' }] })
      });
      const data = await resp.json();
      const clients = (data.results || []).map(page => {
        const props = page.properties;
        return {
          id: page.id,
          nom: props['Nom']?.title?.[0]?.plain_text || '',
          entreprise: props['Entreprise']?.rich_text?.[0]?.plain_text || '',
          email: props['Email']?.email || '',
          formule: props['Formule']?.select?.name || '',
          statut: props['Statut']?.select?.name || '',
          token: props['Token accès']?.rich_text?.[0]?.plain_text || ''
        };
      });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ clients })
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
