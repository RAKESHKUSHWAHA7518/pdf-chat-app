# ── Stage 1: Build the React frontend ──
FROM node:22-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production runner ──
FROM node:22-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

# Install backend dependencies
COPY backend/package*.json backend/.npmrc* ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend/src ./backend/src

# Copy compiled frontend dist into frontend/dist (Express serves it on /)
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set permissions for node user (UID 1000 required by Hugging Face Spaces)
RUN chown -R node:node /app
USER node

EXPOSE 7860

CMD ["node", "backend/src/server.js"]
