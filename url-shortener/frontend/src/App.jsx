import React, { useState, useEffect } from 'react';

export default function App() {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentResult, setCurrentResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [healthStatus, setHealthStatus] = useState('checking'); // 'healthy' | 'error' | 'checking'
  const [history, setHistory] = useState([]);

  // Base API URL: In Docker with Nginx, relative path '' is used.
  // In dev or custom deployment, VITE_API_URL can be configured.
  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Check backend health on initial load
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          setHealthStatus('healthy');
          return;
        }
      }
      setHealthStatus('error');
    } catch {
      setHealthStatus('error');
    }
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const trimmed = inputUrl.trim();

    if (!trimmed) {
      setErrorMessage('Please enter a URL to shorten.');
      return;
    }

    // Basic client-side protocol prefix if user typed example.com
    let target = trimmed;
    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/shorten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: target }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to shorten URL.');
        setLoading(false);
        return;
      }

      // Successful shortening
      setCurrentResult(data);
      setInputUrl('');

      // Add to session history (avoiding duplicate codes)
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.code !== data.code);
        return [data, ...filtered];
      });
    } catch (err) {
      setErrorMessage('Cannot reach backend API. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (url, code) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback for older browsers or restricted iframe contexts
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setCurrentResult(null);
  };

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="brand-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          QuickLink
        </div>
        <h1 className="app-title">URL Shortener</h1>
        <p className="app-subtitle">
          Transform long, cumbersome web addresses into neat, shareable short links.
        </p>

        {/* Health status badge */}
        <div className="health-status" title="Backend connectivity status">
          <span
            className={`status-dot ${
              healthStatus === 'healthy'
                ? 'healthy'
                : healthStatus === 'error'
                ? 'error'
                : ''
            }`}
          />
          {healthStatus === 'healthy' && 'Backend Connected (/health: ok)'}
          {healthStatus === 'error' && 'Backend Offline (Retrying...)'}
          {healthStatus === 'checking' && 'Checking backend status...'}
        </div>
      </header>

      {/* Main Action Card */}
      <main className="card">
        <form onSubmit={handleShorten} className="shorten-form">
          <label htmlFor="url-input" className="form-label">
            Destination URL
          </label>
          <div className="input-row">
            <input
              id="url-input"
              type="text"
              className="url-input"
              placeholder="https://example.com/very/long/article/or/resource"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              disabled={loading}
              autoFocus
            />
            <button
              id="shorten-btn"
              type="submit"
              className="btn-primary"
              disabled={loading || !inputUrl.trim()}
            >
              {loading ? (
                <>
                  <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"/>
                    <line x1="12" y1="18" x2="12" y2="22"/>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                    <line x1="2" y1="12" x2="6" y2="12"/>
                    <line x1="18" y1="12" x2="22" y2="12"/>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                  </svg>
                  Shortening...
                </>
              ) : (
                'Shorten URL'
              )}
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div id="error-message" className="alert-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}
        </form>

        {/* Latest Shortened URL Result */}
        {currentResult && (
          <div id="result-box" className="result-card">
            <div className="result-header">
              <span className="result-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Short URL Ready
              </span>
              <span className="original-url-hint">
                Code: <strong>{currentResult.code}</strong>
              </span>
            </div>

            <div className="result-link-box">
              <a
                id="short-url-link"
                href={currentResult.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="result-url"
              >
                {currentResult.shortUrl}
              </a>
            </div>

            <div className="actions-row">
              <button
                id="copy-btn"
                type="button"
                className={`btn-secondary ${copiedCode === currentResult.code ? 'btn-success' : ''}`}
                onClick={() => handleCopy(currentResult.shortUrl, currentResult.code)}
              >
                {copiedCode === currentResult.code ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy Link
                  </>
                )}
              </button>

              <a
                id="open-url-btn"
                href={currentResult.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Visit / Test Redirect
              </a>
            </div>

            <div className="original-url-hint">
              Original URL: {currentResult.originalUrl}
            </div>
          </div>
        )}
      </main>

      {/* Session History Section */}
      {history.length > 0 && (
        <section className="history-section">
          <div className="history-header">
            <h2 className="history-title">Recently Shortened</h2>
            <button
              id="clear-history-btn"
              type="button"
              className="btn-text"
              onClick={clearHistory}
            >
              Clear
            </button>
          </div>

          <div className="history-list">
            {history.map((item) => (
              <div key={item.code} className="history-item">
                <div className="history-info">
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="history-short"
                  >
                    {item.shortUrl}
                  </a>
                  <span className="history-original" title={item.originalUrl}>
                    {item.originalUrl}
                  </span>
                </div>

                <div className="history-actions">
                  <button
                    type="button"
                    className={`btn-secondary ${copiedCode === item.code ? 'btn-success' : ''}`}
                    onClick={() => handleCopy(item.shortUrl, item.code)}
                    title="Copy short URL"
                  >
                    {copiedCode === item.code ? 'Copied!' : 'Copy'}
                  </button>
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    title="Open destination"
                  >
                    Open
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="app-footer">
        Production-style URL Shortener &bull; In-Memory Express API &bull; React Frontend
      </footer>
    </div>
  );
}
