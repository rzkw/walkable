# Medium RSS Blog Feed Plan

> **For agentic workers:** Use the executing-plans workflow to do these steps. Check off each step as you finish it.

**Goal:** Show up to 10 recent Medium stories above the existing titles in the Blog section.

**How it works:** Add an endpoint that reads Medium's RSS feed. The home page requests it after rendering, so the page does not wait for Medium. Keep all existing blog titles below the new stories.

**Tools:** Next.js App Router, React, TypeScript.

## Rules

- Use the fixed feed URL `https://medium.com/feed/@walkable-llc`. Do not take a URL from the browser.
- Add no packages, shared cache, schedules, or Cloudflare bindings.
- Show up to 10 stories in the order Medium sends them.
- Keep the existing `BLOG_POSTS` data and links unchanged.
- Use the existing Blog title and description styles.
- If the feed fails, show the existing titles without an error message.
- Do not set the route to `runtime = 'edge'`; OpenNext on Cloudflare does not support it.

## Feed format

The live feed was checked on 2026-09-26. Each item has a title, link, GUID, and article content. It has no story-level `<description>`, so use the first useful paragraph from `<content:encoded>`. Titles are wrapped in CDATA. Links have a `?source=...` suffix that should be removed. The GUID is a stable story ID.

---

## Task 1: Add the feed endpoint

**File:** Create `app/api/medium-feed/route.ts`.

- [ ] **Step 1:** Add this route:

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
  const paragraphs = content.match(/<p[^>]*>[\s\S]*?<\/p>/g) ?? []
  for (const paragraph of paragraphs) {
    const result = text(paragraph)
    if (result.length > 20) return result
  }
  return ''
}

export async function GET() {
  const headers = { 'Cache-Control': 'no-store' }

  try {
    const response = await fetch(FEED_URL, {
      headers: { Accept: 'application/rss+xml' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error('Medium feed request failed')

    const xml = await response.text()
    const posts: MediumPost[] = []

    // ponytail: Medium's feed holds at most 10 stories. Keep the on-site posts below them.
    for (const item of xml.split('<item>').slice(1)) {
      if (posts.length >= MAX_POSTS) break

      const title = text(value(item, 'title'))
      const link = value(item, 'link').split('?')[0]
      if (!title || !link.startsWith('https://medium.com/')) continue

      const summary = description(item)
      posts.push({
        id: value(item, 'guid') || link,
        title,
        description:
          summary.length <= DESCRIPTION_LIMIT
            ? summary
            : `${summary.slice(0, DESCRIPTION_LIMIT).trimEnd()}…`,
        link,
      })
    }

    return Response.json({ posts }, { headers })
  } catch {
    return Response.json({ posts: [] }, { status: 502, headers })
  }
}
```

- [ ] **Step 2:** Check types and build:

```bash
./node_modules/.bin/tsc --noEmit
npm run build
```

Both commands should pass. The build should list `ƒ /api/medium-feed`.

- [ ] **Step 3:** Start the app with `npm run dev`, then check the endpoint:

```bash
curl -s http://localhost:3000/api/medium-feed
```

It should return up to 10 stories. Titles should be readable, and links should not have a `?source=` suffix.

---

## Task 2: Show the stories in the Blog section

**File:** Modify `app/page.tsx`. `useState` and `useEffect` are already imported. Do not change `app/data.ts`.

- [ ] **Step 1:** Add this type after `ProjectImageProps`:

```tsx
type MediumPost = {
  id: string
  title: string
  description: string
  link: string
}
```

- [ ] **Step 2:** At the start of `Personal()`, add state and fetch the endpoint after the page mounts:

```tsx
const [mediumPosts, setMediumPosts] = useState<MediumPost[]>([])

useEffect(() => {
  fetch('/api/medium-feed')
    .then((response) => (response.ok ? response.json() : { posts: [] }))
    .then((data) => setMediumPosts(data.posts ?? []))
    .catch(() => setMediumPosts([]))
}, [])
```

- [ ] **Step 3:** Make one list from the Medium stories and existing posts. Add this below the effect:

```tsx
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

- [ ] **Step 4:** In `AnimatedBackground`, replace the existing `BLOG_POSTS.map(...)` with this one map. This keeps the title and description markup in one place and fixes the child type issue from using two separate maps.

```tsx
{
  blogLinks.map((post) => {
    const content = (
      <div className="flex flex-col space-y-1">
        <h4 className="font-normal dark:text-zinc-100">{post.title}</h4>
        <p className="text-zinc-500 dark:text-zinc-400">{post.description}</p>
      </div>
    )
    const className = '-mx-3 rounded-xl px-3 py-3'

    return post.link.startsWith('/') ? (
      <Link
        key={post.id}
        className={className}
        href={post.link}
        data-id={post.id}
      >
        {content}
      </Link>
    ) : (
      <a
        key={post.id}
        className={className}
        href={post.link}
        target="_blank"
        rel="noopener noreferrer"
        data-id={post.id}
      >
        {content}
      </a>
    )
  })
}
```

- [ ] **Step 5:** Check types and build again:

```bash
./node_modules/.bin/tsc --noEmit
npm run build
```

Both commands should pass.

---

## Task 3: Check the page

- [ ] Open the home page. It should appear before the feed request finishes.
- [ ] Confirm the Medium stories appear above the old titles, with the same title and description styles.
- [ ] Confirm each Medium link opens its article in a new tab.
- [ ] Block `/api/medium-feed` in the browser and reload. The old titles should still appear without an error message.
- [ ] Put the type-check and build commands and their output in the implementation PR description.

## References

- Medium Help Center, [Using RSS feeds of profiles, publications, and topics](https://help.medium.com/hc/en-us/articles/214874118-Using-RSS-feeds-of-profiles-publications-and-topics) — Medium's official guide to profile feeds and using them on a website.
- Next.js, [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route) — how App Router API endpoints work.
- React, [useEffect](https://react.dev/reference/react/useEffect) — how to run the browser request after the page mounts.
- RSS 2.0, [Specification](https://www.rssboard.org/rss-specification) — the item, title, link, and GUID fields used by the route.
- Repository note: `reports/2026-08-03-ai-seo-session.md` explains why OpenNext on Cloudflare must not use the Edge runtime.
