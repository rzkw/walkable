import type { MetadataRoute } from 'next'
import { WEBSITE_URL } from '@/lib/constants'

const BLOG_SLUGS = [
  'setting-up-smtp',
  'setting-up-cloudflare',
  'cache-r2bindings',
  'ssh-hardening',
  'grafana',
  'alerting',
]

const PROJECT_SLUGS = [
  'old-laptop-server',
  'exploring-virt',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date('2026-07-26')

  const staticPages = [
    { url: WEBSITE_URL, lastModified: now },
    { url: `${WEBSITE_URL}/blog`, lastModified: now },
    { url: `${WEBSITE_URL}/projects`, lastModified: now },
  ]

  const blogPages = BLOG_SLUGS.map((slug) => ({
    url: `${WEBSITE_URL}/blog/${slug}`,
    lastModified: now,
  }))

  const projectPages = PROJECT_SLUGS.map((slug) => ({
    url: `${WEBSITE_URL}/projects/${slug}`,
    lastModified: now,
  }))

  return [...staticPages, ...blogPages, ...projectPages]
}
