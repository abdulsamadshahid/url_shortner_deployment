import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Enable JSON body parser
app.use(express.json());

// In-memory Map for storing URL mappings
// Key: code (string), Value: { originalUrl: string, createdAt: string, clicks: number }
interface UrlEntry {
  originalUrl: string;
  createdAt: string;
  clicks: number;
}

const urlMap = new Map<string, UrlEntry>();

/**
 * Generate a random 6-character alphanumeric code
 */
function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * Validate URL structure
 */
function isValidUrl(input: string): boolean {
  try {
    const parsed = new URL(input);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// 1. Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 2. Shorten URL endpoint
app.post('/api/shorten', (req, res) => {
  try {
    const { url, longUrl } = req.body || {};
    const targetUrl = (url || longUrl || '').trim();

    if (!targetUrl) {
      res.status(400).json({ error: 'URL is required.' });
      return;
    }

    if (!isValidUrl(targetUrl)) {
      res.status(400).json({
        error: 'Invalid URL. Please enter a valid HTTP or HTTPS URL (e.g., https://example.com)',
      });
      return;
    }

    // Check if we already have this exact URL shortened to reuse code
    for (const [existingCode, entry] of urlMap.entries()) {
      if (entry.originalUrl === targetUrl) {
        const host = req.get('host') || `localhost:${PORT}`;
        const protocol = req.protocol;
        const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
        res.status(200).json({
          code: existingCode,
          shortUrl: `${baseUrl}/api/short/${existingCode}`,
          originalUrl: targetUrl,
        });
        return;
      }
    }

    // Generate unique code
    let code = generateShortCode();
    while (urlMap.has(code)) {
      code = generateShortCode();
    }

    // Store in memory
    urlMap.set(code, {
      originalUrl: targetUrl,
      createdAt: new Date().toISOString(),
      clicks: 0,
    });

    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.protocol;
    const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;

    res.status(201).json({
      code,
      shortUrl: `${baseUrl}/api/short/${code}`,
      originalUrl: targetUrl,
    });
  } catch {
    res.status(500).json({ error: 'Failed to shorten URL. Please try again.' });
  }
});

// 3. Redirect endpoint
app.get('/api/short/:code', (req, res) => {
  const { code } = req.params;
  const entry = urlMap.get(code);

  if (!entry) {
    res.status(404).json({ error: 'Short URL not found or has expired.' });
    return;
  }

  entry.clicks += 1;
  res.redirect(302, entry.originalUrl);
});

// Alias redirect endpoint /s/:code for cleaner URLs
app.get('/s/:code', (req, res) => {
  const { code } = req.params;
  const entry = urlMap.get(code);

  if (!entry) {
    res.status(404).json({ error: 'Short URL not found or has expired.' });
    return;
  }

  entry.clicks += 1;
  res.redirect(302, entry.originalUrl);
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
