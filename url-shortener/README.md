# Production-Style URL Shortener

A small, production-style, but beginner-friendly URL Shortener web application consisting of **only two components**:
1. **Frontend**: React (with Vite & plain CSS) served via Nginx in production.
2. **Backend**: Node.js & Express API with an in-memory Map data structure for mapping short codes to destination URLs.

---

## 1. Application Overview

This application provides a fast, lightweight mechanism to generate short identifiers for long web links:
- **Client Web Interface**: Users can input long URLs, generate short links with one click, copy them directly to clipboard, and test the redirect immediately.
- **In-Memory Store**: Uses a native JavaScript `Map` inside the backend process. No database or external cache needed; mappings persist for the lifetime of the process.
- **RESTful Endpoints**: Provides endpoints to shorten URLs (`POST /api/shorten`), redirect to original destinations (`GET /api/short/:code`), and monitor service health (`GET /health`).

---

## 2. Architecture

```
+-------------------------------------------------------------+
|                         Browser                             |
+------------------------------+------------------------------+
                               |
                               | HTTP (Port 3000)
                               v
+-------------------------------------------------------------+
|               Frontend Container (Nginx)                   |
|  - Serves static compiled React assets for UI (/*)         |
|  - Reverse-proxies /api/* & /health to backend:5000        |
+------------------------------+------------------------------+
                               |
                               | Docker Network (app-network)
                               | http://backend:5000
                               v
+-------------------------------------------------------------+
|               Backend Container (Node.js/Express)           |
|  - In-memory Map store                                     |
|  - URL validation & code generation                        |
|  - Handles 302 redirects                                   |
+-------------------------------------------------------------+
```

---

## 3. Project Structure

```
project/
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main React application component
│   │   ├── index.css           # Plain CSS styling
│   │   └── main.jsx            # React root entry point
│   ├── public/                 # Static assets
│   ├── index.html              # HTML entry template
│   ├── nginx.conf              # Nginx reverse proxy configuration
│   ├── package.json            # Frontend npm dependencies & scripts
│   ├── vite.config.js          # Vite configuration with dev proxy
│   └── Dockerfile              # Multi-stage Docker build (Node -> Nginx)
│
├── backend/
│   ├── src/
│   │   └── index.js            # Express server, in-memory Map, endpoints
│   ├── package.json            # Backend dependencies & scripts
│   └── Dockerfile              # Production Node.js 20 Alpine container
│
├── docker-compose.yml          # Orchestration for frontend and backend
├── .gitignore                  # Git ignore rules
├── .env.example                # Example environment variables
└── README.md                   # Full documentation and usage guide
```

---

## 4. Prerequisites

To run this application locally or in containers, you will need:
- **Docker & Docker Compose** (version 20.10+ recommended)
- Alternatively, for non-container local development:
  - **Node.js** (v18.x or v20.x+)
  - **npm** (v9.x or v10.x+)

---

## 5. Local Development Instructions (Without Docker)

You can run both services independently in two terminal windows:

### Terminal 1: Start Backend API
```bash
cd backend
npm install
npm run dev
```
The backend starts listening on `http://localhost:5000`.

### Terminal 2: Start Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
Vite will start the development server at `http://localhost:3000`. Vite automatically proxies requests starting with `/api` and `/health` to `http://localhost:5000`.

---

## 6. Docker Compose Instructions

To build and run the entire application using Docker Compose in a single command:

```bash
docker compose up --build
```

### Verification
- **Web UI**: Open your browser at [http://localhost:3000](http://localhost:3000).
- **Backend Direct Access**: Accessible at [http://localhost:5000](http://localhost:5000).
- **Docker Healthcheck**: The backend container includes a built-in health check polling `GET /health`. Docker Compose marks the service healthy before routing is completed.

---

## 7. API Endpoints

### `GET /health`
Returns service health status for Docker health checks and frontend monitoring.

- **Response `200 OK`**:
```json
{
  "status": "ok"
}
```

### `POST /api/shorten`
Accepts a long URL, validates the format, and generates a short identifier.

- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "url": "https://www.example.com/some/deep/resource"
}
```
- **Response `201 Created`**:
```json
{
  "code": "aB3x9Z",
  "shortUrl": "http://localhost:3000/api/short/aB3x9Z",
  "originalUrl": "https://www.example.com/some/deep/resource"
}
```
- **Error Response `400 Bad Request`**:
```json
{
  "error": "Invalid URL. Please provide a valid HTTP or HTTPS URL (e.g., https://example.com)"
}
```

### `GET /api/short/:code` (or `/s/:code`)
Redirects the client to the stored original URL.

- **Response**: `302 Found` with `Location: <originalUrl>`
- **Error Response `404 Not Found`**:
```json
{
  "error": "Short URL not found or has expired."
}
```

### Example `curl` Commands

**1. Check health:**
```bash
curl http://localhost:5000/health
```

**2. Shorten a URL:**
```bash
curl -X POST \
  http://localhost:5000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://news.ycombinator.com"}'
```

**3. Test the redirect:**
```bash
curl -i http://localhost:5000/api/short/<INSERT_CODE_HERE>
```

---

## 8. Environment Variables

Variables can be placed in a `.env` file at the root or configured in `docker-compose.yml`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port on which the Express backend server listens |
| `BASE_URL` | `http://localhost:3000` | Base domain used when formatting short URLs returned to clients |
| `VITE_API_URL` | `""` (empty) | Optional API URL override for the frontend (defaults to relative `/api` via Nginx) |

Refer to `.env.example` for reference templates.

---

## 9. How Frontend Communicates With Backend

In containerized deployments, client browsers run outside of Docker's internal container network. Hardcoding container names like `http://backend:5000` into client-side JavaScript will fail in the user's browser, while hardcoding `localhost` breaks multi-host or remote deployments.

This project solves this using an **Nginx reverse proxy**:

1. The frontend React bundle makes API requests to relative paths (e.g., `fetch('/api/shorten')`).
2. These requests arrive at the **frontend container's Nginx process** on port `80` (mapped to port `3000` on the host).
3. Nginx matches the `/api/` and `/health` route locations and forwards the requests internally over Docker's user-defined bridge network (`app-network`) to `http://backend:5000`.
4. Docker's built-in DNS resolves `backend` to the internal IP of the backend container.
5. This architecture completely avoids CORS issues, requires no host networking, and keeps container names hidden from client-side code.

---

## 10. How to Stop and Remove the Containers

To stop the running application:

```bash
# Stop containers gracefully
docker compose down

# Stop containers and remove volumes/networks
docker compose down -v
```
