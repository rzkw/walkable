<img src="/public/Screenshot 2025-07-22 at 3.46.10 PM.png" alt="Cover image representing Walkable, my LLC Website" width="100%" />

Walkable is an independent venture focused on building, documenting and operating infra projects. This repo serves as a working app codebase and a public record of ongoing design decisions, and professional development.

## About this repo

This repo contains the source code for a Next.js web app developed under Walkable.

The exact same code is used to:
- Deploy the app to Cloudflare Workers, and
- Package the app into a Docker container as a standalone unit

Cloudflare-specific components are intentionally kept in both to avoid maintaining multiple versions of the app.

## Docker image

A [multi-architecture Docker image](https://hub.docker.com/r/rzkw/walkable) is available for this app. The image packages the entire Walkable app into a self-contained artifact that can be built and run consistently across environments. It is intended for testing and/or deployment, both local and remote. 

  - Based on slim Node.js image
  - Dockerfile based off of official [Next.js Docker example](https://github.com/vercel/next.js/tree/canary/examples/with-docker)

## Purpose and scope

- Demonstrating experience with production/deployment workflows
- Understanding of containerisation in operations
- Serve as a foundation for future contracting work and external collabs

## Getting Started

This project can be run locally, viewed live, or executed as a Docker container.

- Locally:

  - Clone repo:
    ```
    git clone https://github.com/rzkw/walkable.git
    cd walkable
    ```
  - Install dependencies:
    ```
    npm install
    ```
  - Start dev server (may need to disable Cloudflare-related configs):
    ```
    npm run dev
    ```
- Live:

The [live version](https://www.walk-llc.com) is deployed to Cloudflare Workers directly from this repo, not from the Docker image. 


- Docker container:

  - Pull the image:
    ```
    docker pull rzkw/walkable
    ```
  - Run the container:
    ```
    docker run -p 3000:3000 rzkw/walkable
    ```

## Contact

Walkable is operated independently. For contracting, technical discussions or feedback, feel free to contact via associated professional profiles.

Or submit a pull request! 

## Template

Used a [template](https://github.com/ibelick/nim) built with Next.js 15, React 19, Tailwind CSS v4, and [Motion-Primitives Pro](https://pro.motion-primitives.com/).
