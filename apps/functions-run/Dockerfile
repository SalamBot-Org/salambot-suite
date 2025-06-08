# SalamBot Functions Runtime Dockerfile
# Genkit-based AI functions for SalamBot Suite

FROM node:18-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml* ./
COPY ../../pnpm-workspace.yaml ../../package.json ../../pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:18-alpine AS production

# Install pnpm
RUN npm install -g pnpm@latest

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S salambot -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY --from=base /app/package*.json /app/pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=base --chown=salambot:nodejs /app/dist ./dist
COPY --from=base --chown=salambot:nodejs /app/src ./src

# Switch to non-root user
USER salambot

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["pnpm", "start"]