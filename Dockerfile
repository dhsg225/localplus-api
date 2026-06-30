# LocalPlus API — Production Dockerfile
# Mirrors the AnswerEngine pattern: multi-stage build → distroless runtime.
# No TS compile step — handlers are plain JS mounted by server.mjs.

# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app
# Install only production deps (better layer caching; devDeps like vercel/pg/tsc excluded)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Stage 2: Runtime (Distroless — no shell, no package manager) ───────────────
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app

# Pruned production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
# Application source (handlers + server.mjs). node_modules/.git/.vercel excluded via .dockerignore
COPY . ./

# Build metadata — surfaced via / and logs
ENV NODE_ENV=production
ENV PORT=8080
ENV APP_VERSION=v1-container

EXPOSE 8080

# Bunny probes /health before routing traffic. Distroless node lives at /nodejs/bin/node.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", \
       "require('http').get('http://localhost:8080/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]

# Distroless nodejs image entrypoint is node → runs server.mjs (ESM)
CMD ["server.mjs"]
