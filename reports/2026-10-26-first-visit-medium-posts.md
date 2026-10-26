> **TL;DR:** _The home page now writes the 10 latest Medium posts and the project3 and project4 article images into the HTML at build time. First-time visitors see them straight from the HTML, before any JavaScript runs. Four commits, one plan file, and a one-hour refresh on both Cloudflare and Docker. All checks below were run locally before the PR._

> This report covers the work planned in `plans/2026-10-24-first-visit-medium-posts.md` and merged as PR #281. The plan was reviewed and merged first. The commit rules in `AGENTS.md` (PR #279) landed before the code, so they apply to every commit here.
>
> Related PRs:
>
> - [Plan: show Medium posts and project images on first visit - #277](https://github.com/rzkw/walkable/pull/277)
> - [Docs: add commit size and scope rules to AGENTS.md - #279](https://github.com/rzkw/walkable/pull/279)
> - [Show Medium posts and project images on first visit - #281](https://github.com/rzkw/walkable/pull/281)
> - This report's own pull request.

# First-Visit Medium Posts — Implementation Report (2026-10-26)

## Commits

| #   | Commit                                                                                        | Subject                                                   | Plan task         | Files                                                           | Lines      |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------- | --------------------------------------------------------------- | ---------- |
| 1   | [`d25bf38`](https://github.com/rzkw/walkable/commit/d25bf38c7afeff8572382614e45552631d3b36b6) | `feat: add medium feed reader with article image lookup`  | Task 1            | `lib/medium.ts` (new)                                           | +89        |
| 2   | [`188254b`](https://github.com/rzkw/walkable/commit/188254b464eaf70ebd87703d94ac427dd4101024) | `refactor: read medium feed on the server in home page`   | Task 2, steps 1–5 | `app/page.tsx`                                                  | +52 / −132 |
| 3   | [`712d8d2`](https://github.com/rzkw/walkable/commit/712d8d2d8a07dc1e0e1e7ae2118c78555ee42f5f) | `chore: delete unused medium feed and og api routes`      | Task 2, step 6    | `app/api/medium-feed/route.ts`, `app/api/og/route.ts` (deleted) | −148       |
| 4   | [`d5b650d`](https://github.com/rzkw/walkable/commit/d5b650db388d4c5d4708e5490a74acdb29126227) | `build: add durable object queue for hourly revalidation` | Task 3            | `open-next.config.ts`, `wrangler.jsonc`                         | +16        |

All four commits are SSH-signed and are 1–2 files each. Subjects are 50–55 characters. Each body states why the change was made and cites the plan by task number.

## What changed and why

**Commit 1 — `lib/medium.ts` (new).** Reads the feed on the server. Keeps every `https://` post, including the one on `blog.devops.dev`, and takes each image from the first `<img>` in the article content. If Medium is down at build time the list is empty; if a later refresh fails, Next.js keeps the last good page.

**Commit 2 — `app/page.tsx`.** Was a client page that fetched `/api/medium-feed` and `/api/og`. Now a server page with `revalidate = 3600`, so the posts and image URLs are in the HTML. project1 and project2 keep the screenshots in `data.ts`; project3 and project4 use the image from the linked article. The load-in animation is gone because `motion` cannot render on a server page. Spotlight, Magnetic, AnimatedBackground and the CSS transitions stay.

**Commit 3 — delete both API routes.** The page was their only caller.

**Commit 4 — queue config.** OpenNext's default queue throws, and the caller catches the error, so the page stayed stale until the next deploy on Workers. `queue: doQueue` plus the `NEXT_CACHE_DO_QUEUE` binding fix that. Docker is unchanged: it refreshes from the file system.

## AI assistance versus human decisions

Decisions made by the human, not the agent:

- Choose option 1 for the load-in animation: drop it, keep every mouse-over effect, and build no client child component.
- Only project3 and project4 take images from Medium. project1 and project2 keep local screenshots. Links rotate by hand.
- Keep the check for `blog.devops.dev` after the Checkov post moved back to `medium.com`.
- Remove the Docker note from the plan task, and drop the `[ai-assisted]` commit tag because the collaborator account already shows AI authorship.
- Remove character counts from the plan table.
- Plan first, then a separate PR for the commit rules, then implementation.
- Reference the merged plan in every commit body.
- Simple English in all PR text, plans and reports.
- Move this report into its own PR, because a PR that changes more than 5 files breaks the commit size rule.

Work done by the agent:

- Root cause investigation: live header probes, live feed download, and reading the Next.js and OpenNext sources.
- Writing the plan, the code, the commit messages, and this report.
- Running every check listed below and reporting the failures honestly, including the ones not caused by this change.

## Bugs found

1. **Publication posts were dropped.** The feed route accepted only `https://medium.com/` links, so the `blog.devops.dev` post never showed. It now accepts any `https://` link.
2. **First visits got no feed and no project3 or project4 image.** Both came from browser calls to `/api/*`, which Cloudflare answered with HTTP 403 (`cf-mitigated: challenge`). The page hid the error. The work now happens at build time.
3. **The hourly refresh never ran on Cloudflare.** OpenNext's default queue throws `FatalError`, and the caller catches it, so the page stayed stale until the next deploy. Fixed with the Durable Object queue.
4. **Two plan errors, corrected before coding.** The image host is `cdn-images-1.medium.com`, not `miro.medium.com`. The Checkov post had moved from `aws.plainenglish.io` back to `medium.com`.
5. **Stale `.next` types broke the build after deleting the routes.** `validator.ts` still listed the deleted files. `rm -rf .next` clears it.
6. **`npm run lint` was already broken on `main`.** `next lint` was removed in Next 16, and `eslint-config-next` 16.4.1 rejects TypeScript 7. It needs its own PR.
7. **`.open-next/` is tracked even though `.gitignore` lists it.** A local OpenNext build changes 1300+ files. Restored here; worth a cleanup PR.
8. **Prettier rewrote both config files on save.** Two added lines became 47 changed lines. Re-applied as a 16-line patch.

## Tools used

One model did the work: **DeepSeek V4.1 Flash 1017**, model id `deepseek/deepseek-v4.1-flash-1017` on OpenRouter. No other model was used for this session. It ran inside the opencode agent harness.

| Tool                     | Version                             | Used for                                   |
| ------------------------ | ----------------------------------- | ------------------------------------------ |
| DeepSeek V4.1 Flash 1017 | `deepseek/deepseek-v4.1-flash-1017` | investigation, code, plan, commits, report |
| Node.js                  | 26.3.0                              | build and scripts                          |
| Next.js                  | 16.3.5                              | App Router, ISR                            |
| React                    | 19.3.0                              | server components                          |
| @opennextjs/cloudflare   | 1.20.6                              | Cloudflare build                           |
| wrangler                 | 4.128.0                             | config validation                          |
| TypeScript               | 7.0.2                               | type check                                 |
| ESLint                   | 9.39.4                              | lint attempt (blocked, see bug 6)          |
| curl                     | 8.5.0                               | live site and feed probes                  |
| Python                   | 3.14.6                              | feed XML inspection, patching config files |
| gh CLI                   | 2.45.0                              | PR creation and description updates        |
| git                      | 2.43.0                              | branches, commits, rebases                 |

## Tests and verifications

Run locally on 2026-10-26, in this order.

```
$ npx tsc --noEmit
(no output)

$ rm -rf .next && npm run build
✓ Compiled successfully
✓ Generating static pages (15/15)

Route (app)                      Revalidate  Expire
┌ ○ /                                    1h      1y
├ ○ /_not-found
├ ○ /blog/alerting
├ ○ /blog/cache-r2bindings
├ ○ /blog/example-mdx-metadata
├ ○ /blog/grafana
├ ○ /blog/setting-up-cloudflare
├ ○ /blog/setting-up-smtp
├ ○ /blog/ssh-hardening
├ ○ /projects/exploring-virt
├ ○ /projects/old-laptop-server
├ ○ /robots.txt
└ ○ /sitemap.xml

○  (Static)   prerendered as static content
```

`/` is static with a one-hour revalidate, and the two API routes are gone from the route list.

Baked HTML, `.next/server/app/index.html`:

```
blog.devops.dev:      2   (the post the old filter dropped)
medium post links:    9
blog entries:        18   (10 Medium + 8 hardcoded)
project3 image:       1
project4 image:       1
```

Cloudflare path:

```
$ npx opennextjs-cloudflare build
Worker saved in `.open-next/worker.js` 🚀
OpenNext build complete.

$ grep -c DOQueueHandler .open-next/worker.js
1

$ npx wrangler deploy --dry-run
env.NEXT_CACHE_DO_QUEUE (DOQueueHandler)     Durable Object
env.NEXT_INC_CACHE_R2_BUCKET                 R2 Bucket
env.WORKER_SELF_REFERENCE                    Worker
env.ASSETS                                   Assets
--dry-run: exiting now.
```

```
$ git diff --check main...HEAD
(clean, no output)

$ npm run lint
Invalid project directory provided, no such directory: .../lint
```

The lint failure is pre-existing on `main` and is described in bug 6.

## Known limits

- The feed holds at most 10 posts. A project linked to an older post resolves to a grey placeholder box, not a broken layout.
- Images are hotlinked from `cdn-images-1.medium.com`. If Medium blocks hotlinking, the same placeholder box shows.
- The page refreshes within an hour, so a brand-new post can take up to an hour to appear.
- The load-in animation is gone from the home page. This was a deliberate trade to keep the page a server component.

## References

- Next.js, [Incremental Static Regeneration](https://nextjs.org/docs/app/guides/incremental-static-regeneration) — source of `revalidate = 3600`. A failed refresh keeps the last good page. `cache: 'no-store'` forces dynamic rendering.
- Next.js, [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — a server page can render client components and pass plain data. A component without `"use client"` fails on a server page, so `motion.main` had to go.
- Next.js source, [`PHASE_PRODUCTION_BUILD`](https://github.com/vercel/next.js/blob/canary/packages/next/src/lib/constants.ts) — sets `NEXT_PHASE` during the build. In `node_modules`: `next/dist/build/index.js` line 1212 sets it; `next/dist/server/web/globals.js` line 34 reads it.
- Medium Help Center, [RSS feeds of profiles, publications, and topics](https://help.medium.com/hc/en-us/articles/214874118-Using-RSS-feeds-of-profiles-publications-and-topics) — how a profile feed works. Live check 2026-10-25: one post is on `blog.devops.dev`; the Checkov post moved back to `medium.com`.
- Cloudflare, [Challenges](https://developers.cloudflare.com/cloudflare-challenges/) — a bot check blocks the request until the browser passes. Live check 2026-10-24: `www.walk-llc.com` sent HTTP 403 and `cf-mitigated: challenge` on `/` and `/api/medium-feed`.
- OpenNext.js, [Cloudflare caching](https://opennext.js.org/cloudflare/caching) — where built pages are stored. A queue is required for time-based revalidation.
- OpenNext source, `@opennextjs/aws/dist/overrides/queue/dummy.js` — the default queue throws `Dummy queue is not implemented`. Read from `node_modules`.
- OpenNext source, `@opennextjs/aws/dist/core/routing/util.js` line ~302 — `queue.send` sits in a try/catch, so the failure is silent. Read from `node_modules`.
- Prettier config, `.prettierrc.json` — single quotes and no semicolons. It reformatted the config files (bug 8).
