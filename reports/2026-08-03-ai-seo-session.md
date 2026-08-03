# AI SEO Work — Session Report (2026-08-03)

Session covering PR #159 review fixes, Tech Stack (PR #162), and the project-image resolution work on `docs/ai-seo-plans`.

## Changes implemented

| Change                                                                                        | Commit       | Files                                                | Status                                                              |
| --------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------- | ------------------------------------------------------------------- |
| Author-bio footer on `/projects/*` posts                                                      | `0aeac32`    | `app/projects/layout.tsx`                            | On `docs/ai-seo-plans` (PR #159)                                    |
| Footer `W` black for visibility on `#FACC6E` circle                                           | `82ecb52`    | `app/blog/layout.tsx`, `app/projects/layout.tsx`     | On `docs/ai-seo-plans` (PR #159)                                    |
| Underline Medium link in home page header                                                     | `335369c`    | `app/page.tsx`                                       | On `docs/ai-seo-plans` (PR #159)                                    |
| Replace project video boxes with auto-fetched Medium cover images                             | `d2e3150`    | `app/data.ts`, `app/page.tsx`, `app/api/og/route.ts` | On `docs/ai-seo-plans` (PR #159)                                    |
| Harden `/api/og` against SSRF (strict host allowlist)                                         | `06bd3e0`    | `app/api/og/route.ts`                                | On `docs/ai-seo-plans` (PR #159)                                    |
| Resolve covers from Medium RSS feed; drop third-party reader; relink projects to recent posts | this session | `app/api/og/route.ts`, `app/data.ts`                 | On `docs/ai-seo-plans` (PR #159)                                    |
| Tech Stack section on home page                                                               | `c9e7f59`    | `app/data.ts`, `app/page.tsx`                        | On `feat/tech-stack-section` (PR #162) — **not yet merged to main** |
| Plan review docs                                                                              | —            | `plans/2026-08-03-pr159-review-fixes.md`             | Merged via PR #161                                                  |

`docs/ai-seo-plans` (PR #159) was rebased onto `main` after PR #161 merged, keeping history linear.

## Design decisions and rationale

1. **Why not fetch the Medium article directly?** A server-side `fetch()` of a Medium article URL returns HTTP 403 with a Cloudflare "Just a moment..." JavaScript challenge. Reproduced with both a minimal and a full-browser-header request (Node/undici). The challenge is fingerprint-based (TLS/header heuristics), not header-based, so it cannot be passed by setting `User-Agent`. The `og:image` meta tag is therefore unreachable by a plain server fetch. `?format=json` is likewise 403. Verified in local tests.

2. **Why RSS?** `https://medium.com/feed/@walkable-llc` returns HTTP 200 from the same runtime (no challenge), and each `<item>` carries its canonical `<link>` plus the post's cover image as the first `<img src>` inside `<content:encoded>`. Ceiling: the feed exposes only the latest 10 posts, so a project linked to an older post resolves to no image (`{ image: null }` → placeholder box).

3. **Why a constant feed URL?** The route fetches a compile-time constant, never a user-supplied value. This is what clears GitHub CodeQL's `js/request-forgery` (SSRF) query — CodeQL flags _any_ `fetch()` whose URL derives from user input, regardless of hostname allowlisting (that is exactly why the previous SSRF alert 60 existed even after the hostname check).

4. **SSRF hardening retained:** the `?url=` parameter is still validated (must parse, `https:` only, `hostname === 'medium.com'`) and is used purely as a key to match against feed items; it never reaches `fetch()`.

5. **Relinking the two projects:** the previous links referenced posts older than the latest 10, which the feed cannot resolve. Both projects now point to recent, feed-covered posts (Terraform docs / MCP-verified state; Using `ip route` to configure two nodes) so covers resolve automatically.

6. **Open Graph / og:image:** the `<img src>` surfaced from the feed is the same cover image Medium renders as `og:image`; both are served from Medium's public CDN and render in an `<img>` without CORS issues.

7. **Client unchanged:** `ProjectImage` (`app/page.tsx`) still calls `/api/og?url=…` and renders `{ image }` inside the fixed `aspect-video` box; null → animated placeholder.

## Verification

- Local endpoint tests: valid medium.com URLs → 200 with `miro.medium.com`/`cdn-images-1.medium.com` cover; non-medium / non-https / malformed `url` → 400; unknown-but-valid medium URL → 200 with `{ image: null }`.
- `npm run build` passes (TypeScript + Next build).
- CodeQL SSRF alerts: previous alert on the reader-proxy fetch no longer applies since no user input reaches `fetch()`; pending confirmation on next push.
- Note: `npm run lint` is broken repo-wide (Next 16 removed `next lint`; ESLint 9 flat-config error) — pre-existing, unrelated to this session.

## References

- Medium Help Center — _Using RSS feeds of profiles, publications, and topics_: https://help.medium.com/hc/en-us/articles/214874118-Using-RSS-feeds-of-profiles-publications-and-topics (official product docs; `medium.com/feed/@username` scheme)
- Cloudflare Docs — _How Challenges work_: https://developers.cloudflare.com/cloudflare-challenges/concepts/how-challenges-work/ (why direct fetches from non-browser clients get a managed/JS challenge)
- Cloudflare Docs — _Bots_: https://developers.cloudflare.com/bots/ (bot-detection basis for the challenge)
- StepZen / DEV — _Reading the Medium RSS feed with GraphQL_: https://dev.to/stepzen/reading-the-medium-rss-feed-with-graphql-3ka1 (engineer blog; feed URL structure)
- Open Graph protocol: https://ogp.me/ (`og:image` semantics)
- GitHub CodeQL — _js/request-forgery_ query: https://codeql.github.com/codeql-query-help/javascript/js-request-forgery/ (why user-supplied URLs in `fetch()` are flagged)
- OWASP — _Server-Side Request Forgery Prevention Cheat Sheet_: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html (hostname allowlist rationale)
- Next.js Docs — _Route Handlers_: https://nextjs.org/docs/app/building-your-application/routing/route-handlers (edge route handlers)
- Next.js Docs — _Caching_: https://nextjs.org/docs/app/building-your-application/caching (Cache-Control behavior)
