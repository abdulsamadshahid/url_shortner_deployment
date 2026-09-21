# Backend Dockerfile for Node.js Express API
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install curl for reliable container health checking
RUN apk add --no-cache curl

# Copy package definitions
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy source code
COPY src/ ./src/

# Expose application port
EXPOSE 5000

# Health check against the /health endpoint
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the backend server
CMD ["node", "src/index.js"]
