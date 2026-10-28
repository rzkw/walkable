# Fix Next.js 16.4 Worker Startup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Stop Cloudflare Worker requests from throwing when Next.js loads `preview-props.json`.

**Architecture:** Keep the current baseline application code and update only `@opennextjs/cloudflare` plus its lockfile. The fixed adapter inlines Next.js 16.4's new preview-props file during the build.

**Tech Stack:** Next.js 16.4.3, `@opennextjs/cloudflare` 1.20.12, Cloudflare Workers.

**Spec:** Production exception from Workers Logs: `Unexpected loadManifest(/.next/server/preview-props.json) call!`.

## Global Constraints

- Keep the RSS and project-image feature changes reverted; this PR only fixes the runtime dependency mismatch.
- Use `@opennextjs/cloudflare` 1.20.12, which includes the upstream preview-props fix and is older than the repo's seven-day npm release-age limit.
- Do not deploy to production as part of this change. Require a successful Worker build and runtime preview first.

## Review Focus

- Worker server startup must not try to read `preview-props.json` at runtime.
- The homepage and an existing blog route must return successfully from the Worker runtime, not only compile.
- Existing API routes must still build after the adapter update.

---

### Task 1: Update the OpenNext Cloudflare adapter

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: Existing Next.js 16.4.3 app and OpenNext build configuration.
- Produces: Lockfile resolving `@opennextjs/cloudflare` to 1.20.12 within the declared range.

- [ ] **Step 1: Update the adapter and lockfile**

Set the dependency range to `^1.20.12` and refresh the lockfile without changing the app source or other dependencies intentionally. Do not bypass `.npmrc`'s seven-day release-age policy.

- [ ] **Step 2: Build the Worker**

Run: `npm ci && npx opennextjs-cloudflare build`

Expected: OpenNext finishes successfully and produces `.open-next/worker.js`.

- [ ] **Step 3: Verify runtime behavior**

Run the Worker preview with `npm run preview`. Request `/`, `/blog/ssh-hardening`, and `/api/medium-feed`.

Expected: The requests reach their normal application responses, and no `Unexpected loadManifest(/.next/server/preview-props.json)` exception is logged. A Medium feed fetch failure may return the route's existing 502 response; it must not crash Worker startup.

- [ ] **Step 4: Check the diff**

Run: `git diff --check`

Expected: No output and exit code 0.

- [ ] **Step 5: Commit the dependency fix**

Use a signed commit. Explain that the adapter update fixes Next.js 16.4's preview-props manifest loading at runtime.

## References

- OpenNext Cloudflare, [Fix: include `preview-props.json` in the loadManifest inliner (#1356)](https://github.com/opennextjs/opennextjs-cloudflare/pull/1356) — adds the Next.js 16.4 manifest to the build-time inlining glob.
- OpenNext Cloudflare, [Unexpected `loadManifest(preview-props.json)` call on Next.js 16.4 (#1448)](https://github.com/opennextjs/opennextjs-cloudflare/issues/1448) — documents this exact all-routes runtime failure and its compatibility fix.
- npm, [`@opennextjs/cloudflare` package metadata](https://registry.npmjs.org/@opennextjs%2fcloudflare/latest) — confirms the published versions and release timestamps.
- npm, [`min-release-age` configuration](https://docs.npmjs.com/cli/v11/using-npm/config#min-release-age) — documents the seven-day installation delay configured by this repo's `.npmrc`.
