# ── Backend image ──
# Node runtime aligned with CI
FROM node:22-slim

ENV NODE_ENV=production

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev

# App source
COPY src ./src

# Writable temporary upload directory
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
