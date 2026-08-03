# Project Cover Images via Medium RSS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the cover image for each Selected Project's Medium link without a third-party reader proxy, and without tripping GitHub CodeQL SSRF.

**Context:** The previous implementation (`app/api/og/route.ts`) fetched `https://r.jina.ai/<url>` (a third-party reader) because a direct `fetch()` of a Medium article returns HTTP 403 (Cloudflare JavaScript challenge; fingerprint-based, not header-based). CodeQL flagged the reader-proxy fetch (alert 60) because the fetch URL derives from user input — hostname allowlisting does not silence `js/request-forgery`.

**Approach:** Serve the cover image from the author's own RSS feed, `https://medium.com/feed/@walkable-llc`, which is reachable from any runtime (HTTP 200, no challenge) and includes each post's cover image as the first `<img src>` in `<content:encoded>`. The feed URL is a compile-time constant, so no user input ever reaches `fetch()` → CodeQL-clean. Because the feed only exposes the latest 10 posts, the two project links are updated to recent, feed-covered posts.

**Architecture:** Route handler `app/api/og/route.ts` (Next.js App Router, `runtime = 'edge'`). Client `ProjectImage` in `app/page.tsx` unchanged (`/api/og?url=…` → `{ image }`).

---

## Task 1: Relink projects to feed-covered posts

**Files:**

- Modify: `app/data.ts:30-44`

### Steps

- [ ] **Step 1:** Set `PROJECTS[0]` to Terraform docs with MCP-verified state:
  - `link: https://medium.com/@walkable-llc/terraform-docs-with-mcp-verified-state-and-project-scoped-agent-configs-078a2a41c94f`
- [ ] **Step 2:** Set `PROJECTS[1]` to `ip route` nodes:
  - `link: https://medium.com/@walkable-llc/using-ip-route-to-configure-two-nodes-f71a6ca5aabc`
- [ ] **Step 3:** Update `name`/`description` to match the new titles.

## Task 2: Rewrite the route to use the feed

**Files:**

- Modify: `app/api/og/route.ts`

### Steps

- [ ] **Step 1:** Keep `runtime = 'edge'`; define `const FEED_URL = 'https://medium.com/feed/@walkable-llc'`.
- [ ] **Step 2:** Keep `?url=` validation: must parse, `https:` only, `hostname === 'medium.com'`, else `400 { image: null }`. The value is used only as a match key — never in `fetch()`.
- [ ] **Step 3:** `fetch(FEED_URL)` with `Accept: application/rss+xml` and `AbortSignal.timeout(15000)`; non-OK → `502 { image: null }`.
- [ ] **Step 4:** Split the XML on `<item>`; for each item, strip `?source=…` from `<link>` and compare pathnames against the requested URL's pathname; on match, extract the first `<img src>` from `<content:encoded>` as `image`.
- [ ] **Step 5:** Return `{ image }` (null if no match) with the existing `Cache-Control` headers.
- [ ] **Step 6:** Add a `ponytail:` comment noting the latest-10 ceiling and the upgrade path (explicit `image` field) if a project falls off the feed.

## Task 3: Verify

**Files:** none (verification only)

### Steps

- [ ] **Step 1:** Run the app; confirm `/api/og?url=<project1 link>` and `?url=<project2 link>` return the cover image; confirm an unknown-but-valid medium URL returns `200 { image: null }`; confirm a non-medium URL returns `400`.
- [ ] **Step 2:** Run `npm run build`. Expected: production build succeeds.
- [ ] **Step 3:** Confirm CodeQL does not flag the route on the next push (no user input reaches `fetch()`).
- [ ] **Step 4:** Commit (signed), `git pull --rebase`, push to `docs/ai-seo-plans` (PR #159) with `--force-with-lease`.

---

## Deliberate simplifications

- Regex-based item/image extraction rather than an RSS/XML parser dependency — two patterns, no new dependency (ladder: stdlib).
- Feed fetch is uncached per request (small, personal site); `Cache-Control` on the response still short-circuits repeat requests.
- Link matching is exact pathname equality after stripping the `?source=` suffix. If the user pastes a non-`@walkable-llc` URL form (e.g. `/p/<id>`), no match → placeholder; the latest-10 note applies.
- No jina.ai reference anywhere in the final code or docs — the proxy is gone from the final commits.

## References

- Medium Help Center — _Using RSS feeds of profiles, publications, and topics_: https://help.medium.com/hc/en-us/articles/214874118-Using-RSS-feeds-of-profiles-publications-and-topics
- Cloudflare Docs — _How Challenges work_: https://developers.cloudflare.com/cloudflare-challenges/concepts/how-challenges-work/
- Cloudflare Docs — _Bots_: https://developers.cloudflare.com/bots/
- StepZen / DEV — _Reading the Medium RSS feed with GraphQL_: https://dev.to/stepzen/reading-the-medium-rss-feed-with-graphql-3ka1
- Open Graph protocol: https://ogp.me/
- GitHub CodeQL — _js/request-forgery_: https://codeql.github.com/codeql-query-help/javascript/js-request-forgery/
- OWASP — _SSRF Prevention Cheat Sheet_: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- Next.js Docs — _Route Handlers_: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Next.js Docs — _Caching_: https://nextjs.org/docs/app/building-your-application/caching
