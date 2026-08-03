export const runtime = 'edge'

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
    const res = await fetch(`https://r.jina.ai/${url.href}`, {
      headers: { Accept: 'text/markdown' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      return new Response(JSON.stringify({ image: null }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const body = await res.text()
    const image =
      body.match(
        /!\[[^\]]*\]\(((?:https?:\/\/)[^)]*resize:fit:[^)]*)\)/,
      )?.[1] ?? null

    return new Response(JSON.stringify({ image }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control':
          'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      },
    })
  } catch {
    return new Response(JSON.stringify({ image: null }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
