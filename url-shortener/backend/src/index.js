import express from 'express';
import crypto from 'crypto';

const app = express();

// Configuration via environment variables
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Middleware
app.use(express.json());

// Enable CORS for local development when frontend and backend run on different ports
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-memory JavaScript Map to store URL mappings
// Key: shortCode (string) -> Value: { originalUrl, createdAt, clicks }
const urlDatabase = new Map();

/**
 * Generates a random 6-character alphanumeric code
 */
function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * Validates whether the given string is a valid HTTP or HTTPS URL
 */
function isValidUrl(stringUrl) {
  try {
    const parsed = new URL(stringUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// 1. Health check endpoint
// GET /health
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 2. Shorten URL endpoint
// POST /api/shorten
// Body: { "url": "https://example.com/very/long/url" }
app.post('/api/shorten', (req, res) => {
  try {
    const { url, longUrl } = req.body || {};
    const inputUrl = (url || longUrl || '').trim();

    // Validate presence
    if (!inputUrl) {
      return res.status(400).json({ error: 'URL is required.' });
    }

    // Validate format
    if (!isValidUrl(inputUrl)) {
      return res.status(400).json({
        error: 'Invalid URL. Please provide a valid HTTP or HTTPS URL (e.g., https://example.com)',
      });
    }

    // Check if the URL has already been shortened (deduplication)
    for (const [code, data] of urlDatabase.entries()) {
      if (data.originalUrl === inputUrl) {
        return res.status(200).json({
          code,
          shortUrl: `${BASE_URL}/api/short/${code}`,
          originalUrl: inputUrl,
        });
      }
    }

    // Generate unique code
    let code = generateShortCode();
    while (urlDatabase.has(code)) {
      code = generateShortCode();
    }

    // Store mapping in memory
    urlDatabase.set(code, {
      originalUrl: inputUrl,
      createdAt: new Date().toISOString(),
      clicks: 0,
    });

    return res.status(201).json({
      code,
      shortUrl: `${BASE_URL}/api/short/${code}`,
      originalUrl: inputUrl,
    });
  } catch (err) {
    // Avoid exposing internal stack traces
    return res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
});

// 3. Redirect endpoint
// GET /api/short/:code
app.get('/api/short/:code', (req, res) => {
  const { code } = req.params;
  const entry = urlDatabase.get(code);

  if (!entry) {
    return res.status(404).json({ error: 'Short URL not found or has expired.' });
  }

  // Increment click analytics
  entry.clicks += 1;

  // 302 Found redirect
  return res.redirect(302, entry.originalUrl);
});

// Optional convenience endpoint: /s/:code
app.get('/s/:code', (req, res) => {
  const { code } = req.params;
  const entry = urlDatabase.get(code);

  if (!entry) {
    return res.status(404).json({ error: 'Short URL not found or has expired.' });
  }

  entry.clicks += 1;
  return res.redirect(302, entry.originalUrl);
});

// Start Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`Health check: ${BASE_URL}/health`);
});
