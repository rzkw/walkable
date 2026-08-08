# Edit 08/08/2026: Dockerfile for walk-llc.com using layer caching, separate dev and prod hardened images, pushed to public Docker Hub registry.
#
# References: https://docs.docker.com/engine/manage-resources/contexts/; https://blog.jonrshar.pe/2024/Dec/24/nextjs-prisma-docker.html; https://labs.iximiuz.com/tutorials/docker-multi-stage-builds
#
# Full writeup: https://medium.com/@walkable-llc/optimising-my-dockerfile-for-a-next-js-app-35ace2bd97ef; https://medium.com/@walkable-llc/i-cut-my-multi-arch-build-times-from-10m-to-6-5s-8af80437fd82

# syntax=docker/dockerfile:1

FROM dhi.io/node:24.13.1-dev AS base

# Copy relevant files for npm before installing dependencies 

FROM base AS builder
WORKDIR /app

COPY package*.json ./
RUN  --mount=type=cache,target=/root/.npm npm --no-fund --no-update-notifier ci
COPY . .
RUN --mount=type=cache,target=.next/cache NEXT_TELEMETRY_DISABLED=1 npm run build

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