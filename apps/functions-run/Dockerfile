# =============================================================================
# SalamBot API Gateway Enterprise - Multi-stage Docker Build
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine3.18 AS dependencies

# Métadonnées
LABEL maintainer="SalamBot Platform Team <platform@salambot.ma>"
LABEL version="2.2.0"
LABEL description="SalamBot API Gateway Enterprise - Optimized"

# Installation des outils système nécessaires
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/* \
    && rm -rf /tmp/*

# Création de l'utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S salambot -u 1001 -G nodejs

# Configuration du répertoire de travail
WORKDIR /app

# Configuration du cache npm/pnpm local
RUN corepack enable && \
    pnpm config set store-dir /tmp/.pnpm-store && \
    pnpm config set cache-dir /tmp/.pnpm-cache

# Copie des fichiers de dépendances
COPY apps/functions-run/package.json pnpm-lock.yaml ./
COPY apps/functions-run/tsconfig*.json ./

# Installation des dépendances (avec cache optimisé)
RUN pnpm install --prod --frozen-lockfile --no-audit --no-fund && \
    pnpm store prune && \
    rm -rf /tmp/.pnpm-store /tmp/.pnpm-cache

# -----------------------------------------------------------------------------
# Stage 2: Build Application
# -----------------------------------------------------------------------------
FROM node:20-alpine3.18 AS builder

WORKDIR /app

# Installation et configuration de pnpm
RUN npm install -g pnpm@latest && \
    pnpm config set store-dir /tmp/.pnpm-store && \
    pnpm config set cache-dir /tmp/.pnpm-cache

# Copie des dépendances depuis le stage précédent
COPY --from=dependencies /app/node_modules ./node_modules
COPY apps/functions-run/package.json pnpm-lock.yaml ./
COPY apps/functions-run/tsconfig*.json ./

# Copie du code source
COPY apps/functions-run/src/ ./src/

# Installation des dépendances de développement pour le build
RUN pnpm install

# Build de l'application TypeScript
RUN pnpm run build && \
    pnpm prune --prod && \
    rm -rf /tmp/.pnpm-store /tmp/.pnpm-cache

# -----------------------------------------------------------------------------
# Stage 3: Production Runtime
# -----------------------------------------------------------------------------
FROM node:20-alpine3.18 AS runtime

# Installation des outils système pour la production
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    tini \
    && rm -rf /var/cache/apk/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# Création de l'utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S salambot -u 1001 -G nodejs

# Configuration du répertoire de travail
WORKDIR /app

# Copie des fichiers de production
COPY --from=builder --chown=salambot:nodejs /app/dist ./dist
COPY --from=builder --chown=salambot:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=salambot:nodejs /app/package*.json ./

# Création des répertoires nécessaires
RUN mkdir -p /app/logs /app/tmp && \
    chown -R salambot:nodejs /app

# Configuration des variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV LOG_LEVEL=info
ENV METRICS_ENABLED=true

# Exposition du port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Changement vers l'utilisateur non-root
USER salambot

# Point d'entrée avec init system
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/gateway/index.js"]

# -----------------------------------------------------------------------------
# Stage 4: Development (optionnel)
# -----------------------------------------------------------------------------
FROM node:20-alpine3.18 AS development

WORKDIR /app

# Installation des outils de développement
RUN apk add --no-cache \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/* \
    && rm -rf /tmp/*

# Installation et configuration de pnpm
RUN npm install -g pnpm@latest && \
    pnpm config set store-dir /tmp/.pnpm-store && \
    pnpm config set cache-dir /tmp/.pnpm-cache

# Copie de tous les fichiers
COPY apps/functions-run/package.json pnpm-lock.yaml ./
COPY apps/functions-run/tsconfig*.json ./
COPY apps/functions-run/src/ ./src/

# Installation de toutes les dépendances (dev + prod)
RUN pnpm install

# Variables d'environnement pour le développement
ENV NODE_ENV=development
ENV DEBUG=salambot:*
ENV LOG_LEVEL=debug

EXPOSE 3000 9229

# Commande de développement avec hot reload
CMD ["pnpm", "run", "dev"]