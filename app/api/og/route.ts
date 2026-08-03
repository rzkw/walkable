export const runtime = 'edge'

const FEED_URL = 'https://medium.com/feed/@walkable-llc'

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('url')
  let url: URL | null = null
  if (raw) {
    try {
      url = new URL(raw)
    } catch {
      url = null
    }
  }
  if (!url || url.protocol !== 'https:' || url.hostname !== 'medium.com') {
    return new Response(JSON.stringify({ image: null }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const res = await fetch(FEED_URL, {
      headers: { Accept: 'application/rss+xml' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      return new Response(JSON.stringify({ image: null }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const xml = await res.text()
    // ponytail: feed only holds the latest 10 posts; relink a project (or add
    // an explicit image field) if a project falls off the feed.
    const target = url.pathname.replace(/\/$/, '')
    let image: string | null = null

    for (const item of xml.split('<item>').slice(1)) {
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? ''
      const itemPath = new URL(link).pathname.replace(/\/$/, '')
      if (itemPath === target) {
        image =
          item.match(
            /<content:encoded>[\s\S]*?<img[^>]*src=["']([^"']+)["']/,
          )?.[1] ?? null
        break
      }
    }

    return new Response(JSON.stringify({ image }), {
      headers: {
        'Content-Type': 'application/json',
        // private: response varies by ?url=, but some CDNs (Netlify) key the
        // cache by path only and would serve one URL's image for all of them.
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=300',
      },
    })
  } catch {
    return new Response(JSON.stringify({ image: null }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
