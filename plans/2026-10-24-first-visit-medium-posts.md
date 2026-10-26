# Plan: Show Medium posts and project images on a first visit

> **For workers:** Use the executing-plans workflow. Tick each box when you finish a step.

**Goal:** A first-time visitor sees all 10 latest Medium posts in the Blog section, and sees the images for project3 and project4. No refresh needed.

**How it works:** Read the feed on the server while the site builds. Write the titles, links, and image URLs into the HTML. Refresh the data every hour. The browser never calls an API, so Cloudflare's bot check cannot block it.

**Tools:** Next.js App Router, React, TypeScript.

## Why it fails today (checked on 2026-10-25)

1. The feed code keeps only posts that link to `medium.com`. One current post lives on another Medium site (`blog.devops.dev`), so it gets thrown away. One of the 10 posts is lost.
2. The page asks for the feed and the images from the browser. On a first visit, Cloudflare's bot check blocks that request and sends back HTTP 403 with `cf-mitigated: challenge`. The page shows nothing. A refresh works only because the browser then holds Cloudflare's pass cookie.

## Rules

- Read only the fixed feed `https://medium.com/feed/@walkable-llc`. Never read it from the browser.
- Keep every post that has an `https://` link. Do not filter by site name.
- Show up to 10 posts, in the order Medium sends them. Then show `BLOG_POSTS` with no changes.
- Write the feed into the page while the site builds. Refresh it every 3600 seconds (one hour). Do not set `cache: 'no-store'`. That setting rebuilds the page on every visit, so the content is not built ahead of time.
- If Medium is down while the site builds, use an empty list. Do not fail the build. If Medium is down at a later refresh, stop with an error. Next.js then keeps the last good page.
- `app/page.tsx` becomes a plain server page. Do not create a client wrapper.
- Keep all mouse-over effects: Spotlight, Magnetic, AnimatedBackground, MagneticSocialLink, and the CSS transitions. Remove only the load-in animation (`motion.main`, `motion.section`, the variants and transition constants).
- Project links change by hand from time to time. project1 and project2 keep the screenshots in `data.ts`. project3 and project4 take the image from the article they link to. Find the image by link, so a new link picks up the new image with no code change.
- Add the Cloudflare queue. OpenNext needs a queue for time-based refresh. Without one, the page never refreshes on Cloudflare. It only changes at the next deploy.
- Add no packages and no cron jobs.

## What the feed looks like (checked on 2026-10-25)

The feed has 10 items. Each item has a title, a link with a `?source=...` suffix, an id, and the article HTML in `<content:encoded>`. The first `<img>` in that HTML is the article image. It comes from `cdn-images-1.medium.com`. Item 2 links to `blog.devops.dev`, not `medium.com`. The links for project3 and project4 match `app/data.ts` once the `?source=...` suffix is removed.

## Commit plan

Make small commits. Each one touches 5 files or fewer. Each subject line is 50 to 80 characters.

| Commit | Subject                                                        | Files                                                 |
| ------ | -------------------------------------------------------------- | ----------------------------------------------------- |
| 1      | `feat: add medium feed reader with article image lookup` (54)  | `lib/medium.ts`                                       |
| 2      | `refactor: read medium feed on the server in home page` (53)   | `app/page.tsx`                                        |
| 3      | `chore: delete unused medium feed and og api routes` (50)      | `app/api/medium-feed/route.ts`, `app/api/og/route.ts` |
| 4      | `build: add durable object queue for hourly revalidation` (55) | `open-next.config.ts`, `wrangler.jsonc`               |

- Every commit body says why the change was made.
- Keep commits 1 to 3 in this order. Each one builds on the one before.
- Commit 4 is independent. It can go first or last.
- Run `npm run build` after commit 2, and again at the end.

---

## Task 1: Add `lib/medium.ts`

**File:** Create `lib/medium.ts`.

- [ ] **Step 1:** Add the module:

```ts
const FEED_URL = 'https://medium.com/feed/@walkable-llc'
const MAX_POSTS = 10
const DESCRIPTION_LIMIT = 120

export type MediumPost = {
  id: string
  title: string
  description: string
  link: string
  image: string | null
}

function value(item: string, tag: string): string {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
  return match?.[1]?.trim() ?? ''
}

function text(raw: string): string {
  return raw
    .replace(/^<!\[CDATA\[|\]\]>$/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) =>
      String.fromCodePoint(
        code[0].toLowerCase() === 'x'
          ? parseInt(code.slice(1), 16)
          : Number(code),
      ),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function description(item: string): string {
  const content = value(item, 'content:encoded')
  return (
    content
      .match(/<p[^>]*>[\s\S]*?<\/p>/g)
      ?.map(text)
      .find((result) => result.length > 20) ?? ''
  )
}

export async function getMediumPosts(): Promise<MediumPost[]> {
  try {
    const response = await fetch(FEED_URL, {
      headers: { Accept: 'application/rss+xml' },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error('Medium feed request failed')

    const xml = await response.text()
    const posts: MediumPost[] = []

    for (const item of xml.split('<item>').slice(1)) {
      if (posts.length >= MAX_POSTS) break

      const title = text(value(item, 'title'))
      const link = value(item, 'link').split('?')[0]
      if (!title || !link.startsWith('https://')) continue

      const summary = description(item)
      posts.push({
        id: value(item, 'guid') || link,
        title,
        description:
          summary.length <= DESCRIPTION_LIMIT
            ? summary
            : `${summary.slice(0, DESCRIPTION_LIMIT).trimEnd()}…`,
        link,
        image:
          item.match(
            /<content:encoded>[\s\S]*?<img[^>]*src=["']([^"']+)["']/,
          )?.[1] ?? null,
      })
    }

    return posts
  } catch (error) {
    // While the site builds: use an empty list. Never fail the build.
    if (process.env.NEXT_PHASE === 'phase-production-build') return []
    // At a later refresh: stop with an error. Next.js keeps the last good page.
    throw error
  }
}
```

## Task 2: Rewrite `app/page.tsx`

- [ ] **Step 1:** Remove: the `'use client'` line, the `useEffect`/`useState` import, the `motion` import, `VARIANTS_CONTAINER`, `VARIANTS_SECTION`, `TRANSITION_SECTION`, the local `MediumPost` and `ProjectImageProps` types, the `ProjectImage` component, and the `mediumPosts` state with its `useEffect`.
- [ ] **Step 2:** Read the feed at the top of the component:

```tsx
import { getMediumPosts } from '@/lib/medium'

export const revalidate = 3600

export default async function Personal() {
  const mediumPosts = await getMediumPosts()
  const feedImages = new Map(
    mediumPosts.map((post) => [post.link, post.image]),
  )
  const blogLinks = [
    ...mediumPosts,
    ...BLOG_POSTS.map((post) => ({
      id: post.uid,
      title: post.title,
      description: post.description,
      link: post.link,
    })),
  ]
```

- [ ] **Step 3:** Replace `<motion.main ...>` with `<main className="space-y-24">`. Replace every `<motion.section variants={...} transition={...}>` with `<section>`.
- [ ] **Step 4:** Set the project images. Only project3 and project4 use a Medium image. project1 and project2 keep `image` in `data.ts`. Remove the `ProjectImage` component and use one expression:

```tsx
{
  PROJECTS.map((project) => {
    // project1 and project2: the screenshot in data.ts.
    // project3 and project4: the image from the article they link to.
    const image = project.image ?? feedImages.get(project.link) ?? null
    return (
      <div key={project.name} className="space-y-2">
        <div className="relative rounded-2xl bg-zinc-50/40 p-1 ring-1 ring-zinc-200/50 ring-inset dark:bg-zinc-950/40 dark:ring-zinc-800/50">
          {image ? (
            <img
              src={image}
              alt=""
              loading="lazy"
              className="aspect-video w-full rounded-xl bg-zinc-100 object-cover dark:bg-zinc-900"
            />
          ) : (
            <div className="aspect-video w-full rounded-xl bg-zinc-100 dark:bg-zinc-900" />
          )}
        </div>
        {/* project name and description, unchanged */}
      </div>
    )
  })
}
```

- [ ] **Step 5:** Keep `Spotlight`, `Magnetic`, `AnimatedBackground`, and `MagneticSocialLink` exactly as they are. Keep all other markup and classes unchanged.
- [ ] **Step 6:** Delete `app/api/medium-feed/route.ts` and `app/api/og/route.ts`. `app/page.tsx` is their only user (checked on 2026-10-24).

## Task 3: Turn on hourly refresh on Cloudflare

**File:** `open-next.config.ts` and `wrangler.jsonc`.

- [ ] **Step 1:** Add the queue to `open-next.config.ts`:

```ts
// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from '@opennextjs/cloudflare/config'
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue'

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
})
```

- [ ] **Step 2:** Add the queue binding to `wrangler.jsonc`:

```jsonc
  "durable_objects": {
    "bindings": [
      { "name": "NEXT_CACHE_DO_QUEUE", "class_name": "DOQueueHandler" },
    ],
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["DOQueueHandler"] }],
```

## Task 4: Check the result

Run each command. Put the output in the PR description.

- [ ] **Step 1:** `npm run lint`
- [ ] **Step 2:** `npm run build`. The output must show `/` as a static page, not dynamic.
- [ ] **Step 3:** Look at the built HTML in `.next/server/app/index.html`:
  - [ ] it has `blog.devops.dev` — the post from another Medium site
  - [ ] it has all 10 Medium post links in the Blog section
  - [ ] it has `cdn-images-1.medium.com` image links for project3 and project4
  - [ ] it has `/aws-labs.png` and `/oci-cloudinfra.png` for project1 and project2
- [ ] **Step 4:** `git diff --check`
- [ ] **Step 5:** Run `npm run preview`. Open `/`. The page source must show the 10 posts and the project images.
- [ ] **Step 6:** Run `/ponytail-review` on the diff. Apply what it finds.

## Idea for later: a page of plain HTML only (draft, do not build now)

Today a server builds the page and refreshes it every hour. A plain HTML page has no server.

- A scheduled job fetches the feed, writes the 10 titles, links, and image URLs into the HTML file, commits, and deploys.
- The page stays a plain file. No queue, no cache store, no server code.
- How fresh the page is depends on how often the job runs (for example every hour).
- The cost is one deploy per run, and new posts wait for the next run.
- The repo already does this for `public/llms.txt`: a daily workflow that commits and pushes.

## References

- Medium Help Center, [Using RSS feeds of profiles, publications, and topics](https://help.medium.com/hc/en-us/articles/214874118-Using-RSS-feeds-of-profiles-publications-and-topics) — how a Medium profile feed works. A post keeps the site where it was published. Checked on 2026-10-25: the post on `blog.devops.dev` is in the feed. The Checkov post moved from `aws.plainenglish.io` back to `medium.com`.
- Cloudflare, [Challenges](https://developers.cloudflare.com/cloudflare-challenges/) — a bot check blocks a request until the browser passes it. Checked on 2026-10-24: `www.walk-llc.com` sent HTTP 403 with `cf-mitigated: challenge` on both `/` and `/api/medium-feed`.
- Next.js, [Incremental Static Regeneration](https://nextjs.org/docs/app/guides/incremental-static-regeneration) — the `revalidate = 3600` pattern. If a refresh throws an error, the last good page stays online. An explicit `cache: 'no-store'` rebuilds the page on every visit (see Caveats).
- Next.js, [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — a server page can render client components, and can pass children and plain data as props. A third-party component with no `"use client"` line fails on a server page, which is why `motion.main` must go.
- OpenNext.js, [Cloudflare caching](https://opennext.js.org/cloudflare/caching) — where built pages are stored on Workers, and why time-based refresh needs a queue. Checked in `node_modules`: the default queue is `dummy`, and it throws when used (`@opennextjs/aws/dist/overrides/queue/dummy.js`). That error is caught and logged, so visitors still get the old page (`dist/core/routing/util.js`).
- Next.js source, [`PHASE_PRODUCTION_BUILD`](https://github.com/vercel/next.js/blob/canary/packages/next/src/lib/constants.ts) — the build sets `process.env.NEXT_PHASE = 'phase-production-build'`. Checked in `node_modules`: `next/dist/build/index.js` line 1212 sets it, `next/dist/server/web/globals.js` line 34 reads it.
