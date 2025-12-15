# syntax=docker.io/docker/dockerfile:1

FROM node:25-bookworm-slim AS base


# Copy relevant files for npm before installing dependencies
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm --no-fund --no-update-notifier ci 
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS app
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

EXPOSE 3000


# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
CMD ["node", "server.js"]