Web app for Walkable LLC, built using a [template](https://github.com/ibelick/nim) built with Next.js 15, React 19, Tailwind CSS v4, and [Motion-Primitives Pro](https://pro.motion-primitives.com/).

## About

The repo includes the following:

- Multi-stage Dockerfile to build multi-arch images, pushing artifacts to public Docker registry
- Automated build and deployment with Cloudflare’s integrated CI/CD system: Workers Builds for successful merges to main
- Test/deploy preview to Netlify before publishing to production

## Multi-stage Dockerfile

- Separate build and runtime node.js hardened images
- Uses cache mounts to speed up build: only rebuilds layers when `package*.json` dependencies are changed (dependent on builder machine, most effective when persistent storage/NVMe is available)
- Instructions ordered so that cached layers are reused if the same hash is present
- Runtime stage removes build tools, libraries, dependencies to reduce potential attack surface and final image size
- Container runs as rootless. Necessary directories e.g. `/app/.next/standalone` changed ownership to user `node` to run container under least privilege

## Merge gates

- PR branch must be up to date with main before merging
- All review threads must be resolved before merging
- Linear code history is required
- Commits must have verified SSH signatures
- Dependency review action to scan PRs for dependency changes and vulnerabilities
- CodeQL security scanning to scan code on push, PRs to main, and schedule. Alerts at high severity/above blocks merge
- No force-pushing to main. Commits must be made to a working branch and submitted via PR
- Collaborators (agent) cannot merge 
- Actions to be pinned to commit SHAs
- Only select actions are allowed
- Block commits that contain secrets

## References:

- [Enable GitHub Code Quality](https://docs.github.com/en/code-security/how-tos/maintain-quality-code/enable-code-quality)
- [Configure the Dependency Review Action](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-dependency-review-action)
- [Cloudflare Workers CI/CD](https://developers.cloudflare.com/workers/ci-cd/)
- [Netlify Deploy Previews from Pull/Merge Requests](https://docs.netlify.com/deploy/deploy-types/deploy-previews/#deploy-previews-from-pull--merge-requests)
- [How to Use Cache Mounts to Speed Up Docker Builds (Depot)](https://depot.dev/blog/how-to-use-cache-mount-to-speed-up-docker-builds)