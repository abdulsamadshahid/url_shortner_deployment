# Multi-stage Dockerfile for React Vite Frontend
# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and configuration
COPY . .

# Build production bundle into /app/dist
RUN npm run build

# Stage 2: Serve production bundle with Nginx
FROM nginx:alpine

# Copy custom Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from builder stage to Nginx webroot
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard web port
EXPOSE 80

# Health check for frontend container
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
