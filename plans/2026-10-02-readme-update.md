# README update

## Goal

Rewrite root `README.md` in simple English with casual/professional tone.

## Approach

- Keep cover image.
- Keep intro: site is for Walkable LLC. Walkable builds, documents, and runs infrastructure projects.
- Keep `About this repo`: deploy to Cloudflare Workers, package to Docker.
- Rewrite `Docker image` section:
  - Multi-arch image on Docker Hub at `rzkw/walkable` for x86 (`linux/amd64`) and ARM (`linux/arm64`).
  - Multi-stage build: one stage builds, last stage holds only what is needed to run.
  - Uses hardened Node images: dev image to build, slim prod image to run.
  - Uses build cache for npm and Next.js to keep rebuilds fast.
  - Runs rootless as `node` user.
  - Dockerfile based on official Next.js Docker example.
- Remove `Purpose and scope` section fully.
- Keep `Getting Started`: local, live, Docker. Use short sentences.
- Remove `Contact` section fully.
- Keep `Template` section. Update versions to match `package.json`: Next.js 16, React 19, Tailwind CSS v4, Motion.

## Validation

- `git diff --stat`
- `git diff README.md`
- `npx prettier --check README.md`
- `git status --short`

## References

- Docker multi-stage builds: https://docs.docker.com/build/building/multi-stage/
- Docker cache mounts: https://docs.docker.com/build/guide/mounts/
- Docker `USER` instruction: https://docs.docker.com/reference/dockerfile/#user
- Docker Hardened Images: https://www.docker.com/products/hardened-images/
- Docker multi-platform builds: https://docs.docker.com/build/building/multi-platform/
- Next.js Docker example: https://github.com/vercel/next.js/tree/canary/examples/with-docker
- Next.js `output: standalone`: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- Template `nim`: https://github.com/ibelick/nim
