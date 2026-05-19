# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root dependency manifest
COPY package.json package-lock.json ./
COPY .npmrc ./

# package-lock.json is generated with npm 11; node:20-alpine ships npm 10.
# Keep Docker installs on the same npm major so `npm ci` validates the lockfile.
RUN npm install -g npm@11.12.1 && npm ci

# ---- Stage 2: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY package.json package-lock.json ./
COPY .npmrc ./
COPY tsconfig.base.json ./
COPY shared/ ./shared/
COPY frontend/ ./frontend/

# Disable standalone output for Docker — we'll run next start instead
# This avoids the file tracing issues with hoisted node_modules
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_ vars must be available at build time for Next.js to inline them
ARG NEXT_PUBLIC_TELEGRAM_BOT_NAME=""
ENV NEXT_PUBLIC_TELEGRAM_BOT_NAME=${NEXT_PUBLIC_TELEGRAM_BOT_NAME}
ARG NEXT_PUBLIC_SITE_URL=""
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

RUN npm run build:frontend

# ---- Stage 3: Production runtime ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV CFTC_VIEWER_ROOT=../docs/tools/cftc-export

ARG FRONTEND_PORT=3000
ENV PORT=${FRONTEND_PORT}

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy node_modules and built output
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/frontend ./frontend
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.npmrc ./
COPY --from=builder /app/tsconfig.base.json ./
COPY docs/tools/cftc-export ./docs/tools/cftc-export

RUN chown -R nextjs:nodejs /app

USER nextjs

ARG FRONTEND_PORT=3000
EXPOSE ${FRONTEND_PORT}

CMD ["npm", "run", "start:frontend"]
