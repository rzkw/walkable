<img src="/public/Screenshot 2025-07-22 at 3.46.10 PM.png" alt="Cover image representing Walkable LLC Website" width="100%" />

This is the website for Walkable LLC. Walkable builds, documents, and runs infrastructure projects.

## About this repo

This repo holds the code. It does two things:

- Deploys the site to Cloudflare Workers.
- Packages the site as a Docker container (without Cloudflare plugins).

## Docker image

A [multi-arch image](https://hub.docker.com/r/rzkw/walkable) is on Docker Hub. It runs on x86 (`linux/amd64`) and ARM (`linux/arm64`).

- Multi-stage build. One stage builds the app. The last stage holds only what is needed to run it.
- Hardened Node images. Dev image builds it. Slim prod image runs it.
- Build cache for npm and Next.js. Rebuilds stay fast.
- Runs rootless as the `node` user.
- Dockerfile is based on the official [Next.js Docker example](https://github.com/vercel/next.js/tree/canary/examples/with-docker).

## Getting Started

You can run it local, view it live, or run the Docker image.

- Local:
  - Clone the repo:
    ```
    git clone https://github.com/rzkw/walkable.git
    cd walkable
    ```
  - Install deps:
    ```
    npm install
    ```
  - Start the dev server:
    ```
    npm run dev
    ```

- Live:

  The [live site](https://www.walk-llc.com) runs on Cloudflare Workers. It builds straight from this repo, not from Docker.

- Docker:
  - Pull the image:
    ```
    docker pull rzkw/walkable
    ```
  - Run it:
    ```
    docker run -p 3000:3000 rzkw/walkable
    ```

## Template

Built from this [template](https://github.com/ibelick/nim). It uses Next.js 16, React 19, Tailwind CSS v4, and Motion.
