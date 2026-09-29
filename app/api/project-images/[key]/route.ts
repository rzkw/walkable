import { getCloudflareContext } from '@opennextjs/cloudflare'

const IMAGE_KEY_PATTERN = /^[a-z0-9][a-z0-9-]*\.(?:avif|gif|jpe?g|png|webp)$/i

type ImageObject = {
  body: ReadableStream
  httpEtag: string
  writeHttpMetadata: (headers: Headers) => void
}

type ImageBucket = {
  get: (key: string) => Promise<ImageObject | null>
}

function notFound() {
  return new Response('Image not found', {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params
  if (!IMAGE_KEY_PATTERN.test(key)) return notFound()

  const { env } = getCloudflareContext()
  const bucket = (env as CloudflareEnv & { IMAGES_R2_BUCKET: ImageBucket })
    .IMAGES_R2_BUCKET
  const object = await bucket.get(`projects/${key}`)
  if (!object?.body) return notFound()

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('Cache-Control', 'public, max-age=60')
  headers.set('ETag', object.httpEtag)

  return new Response(object.body, { headers })
}
