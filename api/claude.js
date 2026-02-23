// Proxy Vercel — reçoit les requêtes de l'extension Chrome et appelle l'API Anthropic
// La clé API n'est jamais exposée côté client

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const TIMEOUT_MS = 10000;
const MAX_TOKENS = 1024;

// Headers CORS pour autoriser les requêtes depuis une extension Chrome
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Valide que le body de la requête contient les champs requis
function validateBody(body) {
  if (!body || typeof body !== 'object') {
    return 'Corps de requête invalide';
  }
  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim() === '') {
    return 'Champ "prompt" manquant ou vide';
  }
  if (!body.systemPrompt || typeof body.systemPrompt !== 'string') {
    return 'Champ "systemPrompt" manquant';
  }
  if (body.prompt.length > 4000) {
    return 'Texte trop long (max 4000 caractères)';
  }
  return null;
}

// Appelle l'API Anthropic avec un timeout
async function callAnthropic(prompt, systemPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Clé API manquante côté serveur');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error?.message || `Erreur API (${response.status})`;
      throw new Error(message);
    }

    const data = await response.json();
    return data.content?.[0]?.text ?? '';
  } finally {
    clearTimeout(timer);
  }
}

// Handler principal de la fonction serverless
export default async function handler(req, res) {
  // Réponse aux preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, getCorsHeaders());
    res.end();
    return;
  }

  // Seul POST est accepté
  if (req.method !== 'POST') {
    res.writeHead(405, { ...getCorsHeaders(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Méthode non autorisée' }));
    return;
  }

  // Validation du body
  const validationError = validateBody(req.body);
  if (validationError) {
    res.writeHead(400, { ...getCorsHeaders(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: validationError }));
    return;
  }

  const { prompt, systemPrompt } = req.body;

  try {
    const result = await callAnthropic(prompt, systemPrompt);
    res.writeHead(200, { ...getCorsHeaders(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result }));
  } catch (err) {
    // Timeout
    if (err.name === 'AbortError') {
      res.writeHead(504, { ...getCorsHeaders(), 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Délai dépassé — réessaie dans un instant' }));
      return;
    }
    // Quota ou autre erreur API
    res.writeHead(502, { ...getCorsHeaders(), 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Erreur serveur' }));
  }
}
