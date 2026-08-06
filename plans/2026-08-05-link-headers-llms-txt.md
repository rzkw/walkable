# Plan: Link Response Headers + Auto-Synced llms.txt

**Date:** 2026-08-05
**Branch:** `feat/link-headers-llms-txt`

## Goal

Include `Link` response headers on the homepage for agent discovery (RFC 8288),
and expand `llms.txt` to reflect full site content with daily Medium RSS sync.

## Starting Point

- No `Link` headers on homepage
- `public/llms.txt` exists but is incomplete (6 of 8 blog posts, no certifications, no Medium posts beyond 5)
- No `.well-known/` resources
- Deployed to Cloudflare Workers via OpenNext

## Changes

### 1. `next.config.mjs` — Link header on homepage

Add `headers()` function:

```js
async headers() {
  return [
    {
      source: '/',
      headers: [
        {
          key: 'Link',
          value: '</llms.txt>; rel="describedby"',
        },
      ],
    },
  ]
},
```

Returns `Link: </llms.txt>; rel="describedby"` on `GET /` per RFC 8288 §3.

### 2. `public/llms.txt` — Expanded content

Replace current content with full site inventory:

- **About** — company description (unchanged)
- **Articles — OCI & Terraform** — 4 Medium posts
- **Articles — Security & GitHub** — 3 Medium posts
- **Articles — Linux & Networking** — 3 Medium posts
- **On-site Blog** — 6 MDX posts (hardcoded, no new content will be published)
- **Projects** — 2 MDX projects
- **Certifications** — RHCSA, Azure Fundamentals, CompTIA A+
- **Contact** — email, social links

Each Medium post includes:

- Full title (from RSS `<title>`)
- All categories (from `<category>` tags)
- Content summary (derived from full article content, NOT first sentence)
- Direct URL to post

Topic sections use anchors (e.g., `## Articles — OCI & Terraform` → `#articles-oci-terraform`)
for per-topic `describedby` links.

### 3. `.github/workflows/sync-llms-txt.yml` — Daily sync

GitHub Action that:

1. Fetches `https://medium.com/@walkable-llc/feed` via `curl`
2. Parses RSS XML for 10 most recent posts (title, link, categories, content)
3. Generates content summaries from full article HTML (not first sentence)
4. Merges with hardcoded on-site content template
5. Writes `public/llms.txt`
6. Commits + pushes if changed (`[skip ci]` in commit message)

Schedule: `cron: '0 6 * * *'` (daily 06:00 UTC)

### 4. `public/_headers` — Cache header for llms.txt

Add cache rule for llms.txt (daily sync means 24h cache is safe):

```
/llms.txt
  Cache-Control: public, max-age=86400
```

## What's Skipped

- **API catalog** (`/.well-known/api-catalog`) — no APIs to advertise. Add when endpoints exist.
- **Middleware** — `next.config.mjs` headers is simpler, no runtime cost.
- **On-site blog auto-discovery** — user will only publish on Medium going forward.
- **CORS** — llms.txt served from same origin, no cross-origin fetch needed.

## Validation

After deployment, verify with:

```
curl -I https://www.walk-llc.com/ | grep -i link
# Expected: Link: </llms.txt>; rel="describedby"

curl -s https://www.walk-llc.com/llms.txt | head -20
# Expected: expanded content with Medium posts
```

Or use [isitagentready.com](https://isitagentready.com/api/scan):

```
POST https://isitagentready.com/api/scan
{"url": "https://www.walk-llc.com"}
```

## References

- [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288) — Web Linking, Link header field (§3)
- [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727#section-3) — api-catalog link relation (future use)
- [RFC 8615](https://www.rfc-editor.org/rfc/rfc8615) — Well-Known URIs
- [llmstxt.org](https://llmstxt.org/) — llms.txt specification
- [isitagentready.com skill](https://isitagentready.com/.well-known/agent-skills/link-headers/SKILL.md) — Link headers implementation guide
- [IANA Link Relation Types](https://www.iana.org/assignments/link-relations/) — registered relation types
- [Cloudflare _headers](https://developers.cloudflare.com/pages/configuration/headers/) — headers file format (not used; Next.js config used instead)
- [Next.js headers config](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers) — `next.config.mjs` headers API

## What I May Have Forgotten

- **CORS headers** — if agents fetch llms.txt cross-origin, may need `Access-Control-Allow-Origin`. Currently llms.txt is served from same origin, so not needed.
- **Cache headers** — llms.txt should have reasonable cache duration (e.g., `Cache-Control: public, max-age=86400`) to avoid hammering on every page load. Will add to `_headers` file or `next.config.mjs`.
- **llms.txt Content-Type** — Next.js serves `.txt` files as `text/plain` by default, which is correct per llmstxt.org.
