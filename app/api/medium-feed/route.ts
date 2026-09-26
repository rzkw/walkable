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
  return (
    content
      .match(/<p[^>]*>[\s\S]*?<\/p>/g)
      ?.map(text)
      .find((result) => result.length > 20) ?? ''
  )
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
