> **Edit 08/08/2026:** This report outlines changes I directed for the agent to edit my [website](https://www.walk-llc.com). It follows initial prompting resulting in an implementation plan requiring merge to main before I gave permission to execute: initially to improve [AI SEO](https://github.com/rzkw/walkable/blob/main/plans/ai-seo-implementation.md); to [link images](https://github.com/rzkw/walkable/blob/main/plans/2026-08-03-project-images-rss.md) from my Medium posts and [lastly fix minor bugs](https://github.com/rzkw/walkable/blob/main/plans/2026-08-03-pr159-review-fixes.md). I prompted the agent to specify the exact changes it made, explain design decisions, any tests ran before submitting as SSH-signed PR, and required references to external documentation.
>
> *Related PRs:*
>
> - [ai-seo: add author bio, dateModified schema, lastUpdated to blog posts - #151](https://github.com/rzkw/walkable/pull/151)
> - [Pending layout, content, and JSON-LD updates - #159](https://github.com/rzkw/walkable/pull/159/changes#top)
> - [Fix PR #159 review: blog footer on projects posts + Tech Stack section - #161](https://github.com/rzkw/walkable/pull/161)
> - [feat: add Tech Stack section to home page - #162](https://github.com/rzkw/walkable/pull/162)
> - [fix: drop edge runtime from /api/og (500s on OpenNext Cloudflare) - #164](https://github.com/rzkw/walkable/pull/164)


# AI SEO Work — Session Report (2026-08-03)

Session covering PR #159 review fixes, Tech Stack (PR #162), and the project-image resolution work on `docs/ai-seo-plans`.

## Changes implemented

| Change                                                                                        | Commit       | Files                                                | Status                                                      |
| --------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------- | ----------------------------------------------------------- |
| Author-bio footer on `/projects/*` posts                                                      | `0aeac32`    | `app/projects/layout.tsx`                            | On `docs/ai-seo-plans` (PR #159)                            |
| Footer `W` black for visibility on `#FACC6E` circle                                           | `82ecb52`    | `app/blog/layout.tsx`, `app/projects/layout.tsx`     | On `docs/ai-seo-plans` (PR #159)                            |
| Underline Medium link in home page header                                                     | `335369c`    | `app/page.tsx`                                       | On `docs/ai-seo-plans` (PR #159)                            |
| Replace project video boxes with auto-fetched Medium cover images                             | `d2e3150`    | `app/data.ts`, `app/page.tsx`, `app/api/og/route.ts` | On `docs/ai-seo-plans` (PR #159)                            |
| Harden `/api/og` against SSRF (strict host allowlist)                                         | `06bd3e0`    | `app/api/og/route.ts`                                | On `docs/ai-seo-plans` (PR #159)                            |
| Resolve covers from Medium RSS feed; drop third-party reader; relink projects to recent posts | this session | `app/api/og/route.ts`, `app/data.ts`                 | On `docs/ai-seo-plans` (PR #159)                            |
| Tech Stack section on home page                                                               | `c9e7f59`    | `app/data.ts`, `app/page.tsx`                        | Merged to main, then into `docs/ai-seo-plans` via `a758fe8` |
| Fix `/api/og` shared-cache bug (path-keyed CDN responses)                                     | `6ef69b2`    | `app/api/og/route.ts`                                | On `docs/ai-seo-plans` (PR #159)                            |
| Drop edge runtime from `/api/og` (500s on OpenNext Cloudflare)                                | `c445d6e`    | `app/api/og/route.ts`                                | On `fix/edge-runtime-og` — **not yet deployed**             |
| Plan review docs                                                                              | —            | `plans/2026-08-03-pr159-review-fixes.md`             | Merged via PR #161                                          |

`docs/ai-seo-plans` (PR #159) was rebased onto `main` after PR #161 merged, keeping history linear.

## Design decisions and rationale

1. **Why not fetch the Medium article directly?** A server-side `fetch()` of a Medium article URL returns HTTP 403 with a Cloudflare "Just a moment..." JavaScript challenge. Reproduced with both a minimal and a full-browser-header request (Node/undici). The challenge is fingerprint-based (TLS/header heuristics), not header-based, so it cannot be passed by setting `User-Agent`. The `og:image` meta tag is therefore unreachable by a plain server fetch. `?format=json` is likewise 403. Verified in local tests.

2. **Why RSS?** `https://medium.com/feed/@walkable-llc` returns HTTP 200 from the same runtime (no challenge), and each `<item>` carries its canonical `<link>` plus the post's cover image as the first `<img src>` inside `<content:encoded>`. Ceiling: the feed exposes only the latest 10 posts, so a project linked to an older post resolves to no image (`{ image: null }` → placeholder box).

3. **Why a constant feed URL?** The route fetches a compile-time constant, never a user-supplied value. This is what clears GitHub CodeQL's `js/request-forgery` (SSRF) query — CodeQL flags _any_ `fetch()` whose URL derives from user input, regardless of hostname allowlisting (that is exactly why the previous SSRF alert 60 existed even after the hostname check).

4. **SSRF hardening retained:** the `?url=` parameter is still validated (must parse, `https:` only, `hostname === 'medium.com'`) and is used purely as a key to match against feed items; it never reaches `fetch()`.

5. **Relinking the two projects:** the previous links referenced posts older than the latest 10, which the feed cannot resolve. Both projects now point to recent, feed-covered posts (Terraform docs / MCP-verified state; Using `ip route` to configure two nodes) so covers resolve automatically.

6. **Open Graph / og:image:** the `<img src>` surfaced from the feed is the same cover image Medium renders as `og:image`; both are served from Medium's public CDN and render in an `<img>` without CORS issues.

7. **Client unchanged:** `ProjectImage` (`app/page.tsx`) still calls `/api/og?url=…` and renders `{ image }` inside the fixed `aspect-video` box; null → animated placeholder.

8. **Deploy-preview bug — shared cache keyed by path:** the preview showed the same (first post's) image for every project. Local build and dev-server tests were correct, and the deployed function returned the first feed item's image even for invalid URLs that must 400. Diagnosis: a fresh, never-before-seen `?cb=<nanosecond timestamp>` URL returned `age: 796` — proof the shared cache ignored the query string and reused one path-keyed response. The old route set `public, s-maxage=86400`, so Netlify cached it. Fix: the response now sets `Cache-Control: private, max-age=300, stale-while-revalidate=300`. Per Netlify's caching docs, `private` means its shared cache will not store the response, so every request reaches the edge function and resolves its own post's image; the browser still caches per-URL.

9. **Production 500 — OpenNext Cloudflare does not support the Edge runtime:** after the merge, `walk-llc.com/api/og` returned a generic `500 Internal Server Error` for **every** request, including invalid inputs that must 400 before any I/O. Control paths (`/api/not-real`, `/nonexistent`) 404'd correctly, so the worker had the route but its module crashed on invocation. Root cause: `export const runtime = 'edge'` in `app/api/og/route.ts`. `@opennextjs/cloudflare` (1.19.8) aliases `next/dist/compiled/edge-runtime` to an **empty module**, so edge-runtime routes build and deploy silently but 500 at runtime (opennextjs-cloudflare issue #1028). The Netlify preview had masked this because Netlify Edge runs on Deno and supports edge routes. Fix: remove the declaration — the route runs through OpenNext's Node.js runtime path (Workers already execute at the edge, and the route uses only Web APIs). Verified by running the OpenNext build under `opennextjs-cloudflare preview` (real workerd): distinct covers per project, `{ image: null }` for an older post, 400 for non-medium/missing URLs. Not fixed by upgrading OpenNext: edge runtime is intentionally unsupported (empty shim by design, issue still open), and 1.19.x also had a separate regression breaking all dynamic routes on Next 16.2.x (issue #1258; this repo runs Next 16.2.11).

## Verification

- Local endpoint tests: valid medium.com URLs → 200 with `miro.medium.com`/`cdn-images-1.medium.com` cover; non-medium / non-https / malformed `url` → 400; unknown-but-valid medium URL → 200 with `{ image: null }`.
- Deployed Netlify preview (deploy `6a7064591cd3de00082f955e`): `/api/og` returns distinct covers for the Terraform-docs and `ip route` projects, `{ image: null }` for an older post, 400 for `evil.com` and for a missing `url`; response header is `cache-control: private,max-age=300` (was `public,s-maxage=86400`).
- Workerd (real Cloudflare runtime, `opennextjs-cloudflare build && preview`): after removing `runtime = 'edge'`, `/api/og` returns the Terraform-docs cover for project 1, the `ip route` cover for project 2, `{ image: null }` for an older post, and 400 for `evil.com` / missing `url`.
- Production `walk-llc.com` before the fix: every `/api/og` request (valid and invalid) → `500 Internal Server Error`; control paths → 404. Deploy of the fix is pending (needs Cloudflare auth).
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
- Next.js Docs — _Route Handlers_: https://nextjs.org/docs/app/building-your-application/routing/route-handlers (route handlers)
- Next.js Docs — _Caching_: https://nextjs.org/docs/app/building-your-application/caching (Cache-Control behavior)
- Netlify Docs — _Caching overview_: https://docs.netlify.com/build/caching/caching-overview/ (function/proxy responses are not cached by default and become cacheable only via cache-control headers; `private` is not stored in Netlify's shared cache)
- OpenNext Cloudflare docs — _Cloudflare_: https://opennext.js.org/cloudflare (apps should use the Node.js runtime; all routes already run at the edge on Workers)
- opennextjs-cloudflare issue #1028 — _[BUG] Edge runtime causes silent 500 errors instead of build/runtime warning_: https://github.com/opennextjs/opennextjs-cloudflare/issues/1028 (empty edge-runtime shim → silent 500s; still open)
- opennextjs-cloudflare issue #1258 — _Next 16.2.x + 1.19.8 — every dynamic route 500s with `ComponentMod.handler is not a function`_: https://github.com/opennextjs/opennextjs-cloudflare/issues/1258 (why not to upgrade OpenNext here)
- Dev.to — _Deploying Next.js App to Cloudflare Workers with OpenNext_ (step 5: remove `export const runtime = "edge"`): https://dev.to/prajwolshrestha/deploying-nextjs-app-to-cloudflare-workers-with-opennext-hi0
