# PR #159 Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address PR #159 review: author-bio footer on every blog post (incl. `/projects/*` posts) and a Tech Stack section on the home page.

**Architecture:** Two isolated UI additions. (1) `app/projects/layout.tsx` is a near-copy of `app/blog/layout.tsx` but lacks the author-bio footer; copy the footer block verbatim. (2) Add a `TECH_STACK` constant to `app/data.ts` (the page's established data pattern) and render it in a new `motion.section` on `app/page.tsx`, styled to match the existing Blog title/subtitle classes.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, `motion` (framer-motion) via `motion/react`, MDX.

---

## Task 1: Add author-bio footer to `/projects/*` posts

**Files:**

- Modify: `app/projects/layout.tsx:22`

### Steps

- [ ] **Step 1: Read both layouts to confirm the footer block to copy**

Run: `sed -n '20,39p' app/blog/layout.tsx`
Expected: the `</main>` close tag plus the `<footer>` block:

```jsx
      </main>

      <footer className="mt-16 border-t border-gray-200 pt-8 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FACC6E] font-medium text-gray-600 dark:text-gray-300">
            W
          </div>
          <div>
            <p className="text-sm font-medium">Walkable LLC</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Linux Engineering · RHCSA · Azure Fundamentals · CompTIA A+
            </p>
          </div>
        </div>
      </footer>
```

- [ ] **Step 2: Append the footer block to `app/projects/layout.tsx`**

Edit `app/projects/layout.tsx` so the return fragment becomes (after the `</main>` close, inside the fragment):

```jsx
      </main>

      <footer className="mt-16 border-t border-gray-200 pt-8 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FACC6E] font-medium text-gray-600 dark:text-gray-300">
            W
          </div>
          <div>
            <p className="text-sm font-medium">Walkable LLC</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Linux Engineering · RHCSA · Azure Fundamentals · CompTIA A+
            </p>
          </div>
        </div>
      </footer>
    </>
```

- [ ] **Step 3: Verify render**

Run: `npm run dev`, open `http://localhost:3000/projects/exploring-virt` and `http://localhost:3000/projects/old-laptop-server`
Expected: the "W / Walkable LLC / Linux Engineering · RHCSA · Azure Fundamentals · CompTIA A+" footer appears above the site-wide `© 2025 Walkable LLC` footer on both pages.

- [ ] **Step 4: Commit**

```bash
git add app/projects/layout.tsx
git commit -m "fix: add author bio footer to projects posts"
```

## Task 2: Add Tech Stack section to home page

**Files:**

- Modify: `app/data.ts` (append `TECH_STACK`)
- Modify: `app/page.tsx` (import + render section between intro and Selected Projects)

### Steps

- [ ] **Step 1: Add `TECH_STACK` constant to `app/data.ts`**

Append after the `BLOG_POSTS` export:

```ts
type TechStack = {
  category: string
  skills: string
}

export const TECH_STACK: TechStack[] = [
  {
    category: 'Proficient in:',
    skills:
      'Git • Docker • Linux • Bash • Ubuntu • GitHub • RHEL • Networking (TCP/IP, DNS) • VS Code • macOS',
  },
  {
    category: 'Experienced with:',
    skills:
      'GitHub Actions • Jira • Cloudflare • Grafana • MCP (Model Context Protocol) • Opencode • Slack • Claude',
  },
  {
    category: 'Exposure to:',
    skills:
      'Oracle Cloud Infrastructure • Terraform • YAML • AWS • Ansible • Azure • PowerShell • Python • JavaScript • Vercel • Kubernetes',
  },
]
```

- [ ] **Step 2: Import `TECH_STACK` in `app/page.tsx`**

Add `TECH_STACK,` to the destructured import from `'./data'` (line 15-21).

- [ ] **Step 3: Render the section above Selected Projects**

Insert between the intro `motion.section` (ends line 143) and the Selected Projects `motion.section` (starts line 145):

```jsx
<motion.section variants={VARIANTS_SECTION} transition={TRANSITION_SECTION}>
  <h3 className="mb-5 text-lg font-medium">Tech Stack</h3>
  <div className="flex flex-col space-y-2">
    {TECH_STACK.map((item) => (
      <div key={item.category}>
        <span className="font-normal dark:text-zinc-100">{item.category}</span>{' '}
        <span className="text-zinc-500 dark:text-zinc-400">{item.skills}</span>
      </div>
    ))}
  </div>
</motion.section>
```

Category label uses the Blog title classes (light/white in dark mode); skills use the Blog subtitle classes (grey).

- [ ] **Step 4: Verify render**

Run: `npm run dev`, open `http://localhost:3000`
Expected: a "Tech Stack" heading directly above "Selected Projects", with three rows: white category label + grey tech list.

- [ ] **Step 5: Commit**

```bash
git add app/data.ts app/page.tsx
git commit -m "feat: add Tech Stack section to home page"
```

## Task 3: Lint, build, and finalize

**Files:** none (verification only)

### Steps

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: production build succeeds.

- [ ] **Step 3: Verify signature and push**

```bash
git log --show-signature -1
git push -u origin fix/pr159-review-fixes
```

---

## Deliberate simplifications

- Footer block copied verbatim into `app/projects/layout.tsx` rather than extracting a shared `<AuthorBio />` component. The two layouts are already duplicated wholesale; matching the existing pattern is the shortest diff. Extract a shared component when a third layout needs the footer.
- Tech Stack items are plain text (no per-item links), matching the provided content.
