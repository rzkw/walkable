# AI SEO Implementation Plan — Walkable LLC

**Goal**: Get cited by AI systems (ChatGPT, Perplexity, Google AI Overviews) for Linux/DevOps queries to attract paid US/EU contracts.

**Competitors**: Mid-level DevOps engineers and consultancies in US/EU markets.

---

## Phase 1: Unblock AI Crawlers ✅

- `app/robots.ts` — Allow GPTBot, ClaudeBot, Google-Extended, PerplexityBot; block CCBot
- `app/sitemap.ts` — Update lastModified dates to current
- `public/llms.txt` — Add AI-readable site context file

**Status**: Merged via PR #149

---

## Phase 2: Website Authorship & Schema

- `mdx-components.tsx` — Add ArticleJsonLd component with `dateModified` support
- `app/blog/layout.tsx` — Add visible author bio footer with Walkable LLC branding (#FACC6E circle color)
- All 6 blog posts — Add `date`, `lastModified`, `author` metadata + ArticleJsonLd with `dateModified`

**Status**: Merged via PR #151

---

## Phase 2d: Medium Optimization

**Not implemented yet.** See medium-changes.md for drafts.

Actions:
- Add author bio to Medium profile
- Update existing posts with `datePublished` + `dateModified`
- Add llms.txt-style context to each post
- Update profile headline and about section

---

## Phase 3: Expand Reach (Not started)

- Cross-post to Dev.to (user has no account yet)
- Reddit participation in r/devops, r/linuxadmin, r/selfhosted
- Add `/services.md` page to walk-llc.com

---

## Phase 4: Monitor & Iterate (Not started)

- Track citations in AI tools
- Adjust llms.txt and schema based on results
