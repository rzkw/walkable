# Dockerfile built with dhi.io hardened image for testing

FROM dhi.io/node:24.13.1-dev AS base


# Copy relevant files for npm before installing dependencies
FROM base AS builder
WORKDIR /app

COPY package*.json ./
RUN npm --no-fund --no-update-notifier ci
COPY . .
RUN NEXT_TELEMETRY_DISABLED=1 npm run build

# Production image, copy all the files and run next
FROM dhi.io/node:24 AS app
WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder --chown=node /app/.next/standalone ./
COPY --from=builder --chown=node /app/.next/static ./.next/static

USER node

ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

EXPOSE 3000


# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
CMD ["node", "server.js"]