# Medium RSS Blog Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the 10 most recent Medium stories at the top of the Blog section, above the existing blog titles, without making the home page wait for Medium.

**Architecture:** One new app endpoint (`app/api/medium-feed/route.ts`) reads the fixed Medium RSS feed and returns plain JSON. The home page requests that endpoint after it renders, so Medium is never on the critical path. Existing `BLOG_POSTS` entries stay exactly as they are, below the new stories.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, deployed through `@opennextjs/cloudflare`.

## Global Constraints

- Use the fixed feed URL `https://medium.com/feed/@walkable-llc` in server code. Never accept a feed URL from the browser.
- Do not add any new package.
- Do not add timed revalidation, cron, or a queue. The browser fetches the endpoint after the page renders.
- Show at most 10 stories, in the order Medium gives them.
- Keep every `BLOG_POSTS` entry, its title, description, link, and position unchanged.
- Use the same title and description classes the existing blog links use.
- If the endpoint fails, the existing blog titles must still show. No error text, no spinner.
- Do not add `runtime = 'edge'` to the new route. OpenNext on Cloudflare does not support the edge runtime (see `reports/2026-08-03-ai-seo-session.md`).

## What the Medium feed actually looks like

Checked on 2026-09-26 against the live feed. These facts drive the parsing code:

- The feed has exactly 10 `<item>` blocks. That is the ceiling, so the plan never needs more than 10.
- Each item has `<title>`, `<link>`, `<guid>`, `<category>`, `<dc:creator>`, `<pubDate>`, and `<content:encoded>`.
- **There is no `<description>` inside an item.** The only `<description>` in the file belongs to the channel. So the short description is taken from the first real paragraph inside `<content:encoded>`.
- `<title>` is wrapped in CDATA: `<title><![CDATA[Deploying a budget to OCI by Terraform]]></title>`. CDATA must be unwrapped before tags are stripped, otherwise the whole title disappears.
- `<link>` carries a tracking suffix: `https://medium.com/@walkable-llc/<slug>?source=rss-274e4807a939------2`. Cut everything from `?` onward.
- `<guid isPermaLink="true">https://medium.com/p/faab5c664403</guid>` is stable per story, so it makes a good React key and `data-id`.

---

## Task 1: Add the feed endpoint

**Files:**

- Create: `app/api/medium-feed/route.ts`

**Interfaces:**

- Consumes: nothing. It fetches the feed on its own.
- Produces: `GET /api/medium-feed` returns `{ posts: MediumPost[] }`, where `MediumPost` is `{ id: string, title: string, description: string, link: string }`. On failure it returns status `502` with `{ posts: [] }`.

- [ ] **Step 1:** Create `app/api/medium-feed/route.ts` with this content:

```ts
const FEED_URL = 'https://medium.com/feed/@walkable-llc'
const MAX_POSTS = 10
const DESCRIPTION_LIMIT = 120

type MediumPost = {
  id: string
  title: string
  description: string
  link: string
}

function toPlainText(raw: string): string {
  return raw
    .trim()
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCharCode(parseInt(code, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function tagValue(item: string, tag: string): string {
  const match = item.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`),
  )
  return match ? match[1] : ''
}

function firstParagraph(content: string): string {
  const paragraphs = content.match(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/g) ?? []
  for (const paragraph of paragraphs) {
    const text = decodeEntities(toPlainText(paragraph))
    if (text.length > 20) {
      return text
    }
  }
  return ''
}

function isMediumLink(link: string): boolean {
  try {
    const url = new URL(link)
    return url.protocol === 'https:' && url.hostname === 'medium.com'
  } catch {
    return false
  }
}

function shorten(text: string, limit: number): string {
  if (text.length <= limit) {
    return text
  }
  return `${text.slice(0, limit).trimEnd()}…`
}

export async function GET() {
  try {
    const response = await fetch(FEED_URL, {
      headers: { Accept: 'application/rss+xml' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) {
      throw new Error(`feed status ${response.status}`)
    }
    const xml = await response.text()
    const posts: MediumPost[] = []

    for (const item of xml.split('<item>').slice(1)) {
      if (posts.length === MAX_POSTS) {
        break
      }
      const link = tagValue(item, 'link').trim().split('?')[0]
      const title = decodeEntities(toPlainText(tagValue(item, 'title')))
      if (!title || !isMediumLink(link)) {
        continue
      }
      posts.push({
        id: tagValue(item, 'guid').trim() || link,
        title,
        description: shorten(
          firstParagraph(tagValue(item, 'content:encoded')),
          DESCRIPTION_LIMIT,
        ),
        link,
      })
    }

    return Response.json(
      { posts },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return Response.json(
      { posts: [] as MediumPost[] },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
```

Notes on the code:

- `toPlainText` removes CDATA first, then tags. Doing it in this order is what keeps the title readable.
- `firstParagraph` gives a plain sentence from the article body, because the feed has no per-item description. It ignores very short paragraphs so captions and stray words are not used.
- `isMediumLink` keeps only `https` links on `medium.com`. The link comes from the feed, not the browser, and this check makes sure a strange feed value can never become a link to another site.
- `Response.json` is used instead of `new Response(JSON.stringify(...))` for less code.

- [ ] **Step 2:** Check the types and build:

```bash
./node_modules/.bin/tsc --noEmit
npm run build
```

Expected: both commands finish with no errors.

- [ ] **Step 3:** Check the endpoint by hand. Start the app with `npm run dev`, then run:

```bash
curl -s http://localhost:3000/api/medium-feed | head -c 600
```

Expected: JSON that starts with `{"posts":[{"id":"https://medium.com/p/faab5c664403","title":"Deploying a budget to OCI by Terraform","description":"...","link":"https://medium.com/@walkable-llc/deploying-a-budget-to-oci-by-terraform-faab5c664403"}`. Titles must be readable, links must not contain `?source=`.

- [ ] **Step 4:** Commit:

```bash
git add app/api/medium-feed/route.ts
git commit -S -m "feat: add Medium RSS feed endpoint"
```

---

## Task 2: Show the stories above the existing blog titles

**Files:**

- Modify: `app/page.tsx` only. No new import is needed, because `useState` and `useEffect` are already imported at the top of the file. No change to `app/data.ts`.

**Interfaces:**

- Consumes: `GET /api/medium-feed` returning `{ posts: MediumPost[] }` from Task 1.
- Produces: nothing new for other files.

- [ ] **Step 1:** Add the type and state near the top of `app/page.tsx`, after the `ProjectImageProps` type:

```tsx
type MediumPost = {
  id: string
  title: string
  description: string
  link: string
}
```

- [ ] **Step 2:** Add the fetch inside `Personal()`, right after `export default function Personal() {`:

```tsx
const [mediumPosts, setMediumPosts] = useState<MediumPost[]>([])

useEffect(() => {
  let cancelled = false
  fetch('/api/medium-feed')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (cancelled || !Array.isArray(data?.posts)) {
        return
      }
      setMediumPosts(data.posts)
    })
    .catch(() => setMediumPosts([]))
  return () => {
    cancelled = true
  }
}, [])
```

This copies the request pattern already used by `ProjectImage` in the same file, so the home page loads without waiting for the feed. On any failure the list stays empty and the existing titles remain.

- [ ] **Step 3:** Build one list of links and give it to the existing block. In `Personal()`, right after the `useEffect`, add:

```tsx
const blogLinks = [
  ...mediumPosts.map((post) => (
    <a
      key={post.id}
      data-id={post.id}
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className="-mx-3 rounded-xl px-3 py-3"
    >
      <div className="flex flex-col space-y-1">
        <h4 className="font-normal dark:text-zinc-100">{post.title}</h4>
        <p className="text-zinc-500 dark:text-zinc-400">{post.description}</p>
      </div>
    </a>
  )),
  ...BLOG_POSTS.map((post) => (
    <Link
      key={post.uid}
      data-id={post.uid}
      href={post.link}
      className="-mx-3 rounded-xl px-3 py-3"
    >
      <div className="flex flex-col space-y-1">
        <h4 className="font-normal dark:text-zinc-100">{post.title}</h4>
        <p className="text-zinc-500 dark:text-zinc-400">{post.description}</p>
      </div>
    </Link>
  )),
]
```

Then replace the whole `{BLOG_POSTS.map((post) => ( ... ))}` block inside `AnimatedBackground` with:

```tsx
{
  blogLinks
}
```

The Medium stories come first, then the existing titles. Both kinds of link stay in the same `AnimatedBackground` block, so the hover highlight still works on every row. Nothing in `app/data.ts` changes.

**Why one list and not two `.map()` calls next to each other:** `AnimatedBackground` types `children` as one element or an array of elements. Two sibling `.map()` expressions do not match that type and the type check fails with `TS2739`. One array variable does match it. This was confirmed by running the type check.

- [ ] **Step 4:** Check types and build again:

```bash
./node_modules/.bin/tsc --noEmit
npm run build
```

Expected: both commands finish with no errors, and the build output lists `ƒ /api/medium-feed`.

- [ ] **Step 5:** Commit:

```bash
git add app/page.tsx
git commit -S -m "feat: show recent Medium stories above blog titles"
```

---

## Task 3: Verify the whole thing by hand

**Files:** none

- [ ] **Step 1:** Run `npm run dev` and open `http://localhost:3000`.
- [ ] **Step 2:** Confirm the page shows the text at once, and the Medium stories appear a moment later inside the Blog section.
- [ ] **Step 3:** Confirm there are at most 10 stories, the newest first, and that all 8 existing blog titles still sit below them in the same order.
- [ ] **Step 4:** Click a Medium story. Confirm a new tab opens on the Medium article and the address has no `?source=` in it.
- [ ] **Step 5:** Turn off the network in the browser tab and reload. Confirm the existing blog titles still show and no error text appears.
- [ ] **Step 6:** Run the commands below and paste the real output into the pull request description:

```bash
./node_modules/.bin/tsc --noEmit
npm run build
curl -s http://localhost:3000/api/medium-feed | head -c 600
```

## Already verified

The code in this plan was written and run on 2026-09-26 before the plan was submitted. Results:

- `./node_modules/.bin/tsc --noEmit` → exit 0. Use the local binary, because plain `npx tsc` installs an unrelated package instead of the project's TypeScript.
- `npm run build` → succeeded, and the route list included `ƒ /api/medium-feed`.
- `GET /api/medium-feed` → `200` with 10 posts. Every title was non-empty, every link was a clean `https://medium.com/@walkable-llc/...` link with no `?source=`, all 10 ids were unique, and the longest description was 121 characters (120 plus the ellipsis).
- `GET /` → `200`, and the server-rendered HTML still contained the existing blog title "SSH security hardening and other bits", so the old links do not depend on the feed.

## PR checklist

- [ ] Feed stories appear at the top of the Blog section.
- [ ] Links open the Medium article directly.
- [ ] Title and description styling match the existing blog links.
- [ ] Existing blog titles and links are unchanged.
- [ ] New posts show up after a page reload, with no deploy and no code change.
- [ ] `./node_modules/.bin/tsc --noEmit` and `npm run build` pass, and the output is in the PR description.

## Deliberate simplifications

- No package for XML parsing. The feed is read with the same small regex style already used in `app/api/og/route.ts`.
- No cache and no revalidation. The browser asks the endpoint after the page renders. That is enough for this small site, and it means no new Cloudflare bindings.
- No loading state. The list simply appears when it arrives.
- The feed only holds the latest 10 stories, so the list shows 10 items and then the older on-site titles.

## References

- Medium Help Center, _Using RSS feeds of profiles, publications, and topics_ — https://help.medium.com/hc/en-us/articles/214874118-Using-RSS-feeds-of-profiles-publications-and-topics (official docs; the `medium.com/feed/@username` URL and the note that only part of the profile feed is available)
- Next.js, _Route Handlers_ — https://nextjs.org/docs/app/api-reference/file-conventions/route (official docs; how `app/api/*/route.ts` handlers work, and the rule that a route file should only export handlers and route config)
- Next.js, _Server and Client Components_ — https://nextjs.org/docs/app/getting-started/server-and-client-components (official docs; the file is marked `'use client'`, so the fetch runs in the browser)
- React, _useEffect_ — https://react.dev/reference/react/useEffect (official docs; used to run the request after the page renders instead of blocking it)
- OpenNext Cloudflare, _Caching_ — https://opennextjs.org/cloudflare/caching (official docs; timed revalidation needs a Durable Object queue, which is why this plan skips timed revalidation)
- RSS 2.0 specification, _Rich Site Summary (RSS) Specification_ — https://www.rssboard.org/rss-specification (the `<item>`, `<title>`, `<link>`, and `<guid>` fields this plan reads)
- Repository precedent: `app/api/og/route.ts` (the existing route that reads the same fixed Medium feed URL) and `reports/2026-08-03-ai-seo-session.md` (why the edge runtime must not be used on Cloudflare)
