> **TL;DR:** _Every page on www.walk-llc.com returned HTTP 500 for 3 days and 18 hours. A dependency update on 2026-10-25 moved Next.js to 16.4.3 but left the Cloudflare adapter on OpenNext 1.20.9. Next.js 16.4 reads a new list file when the server starts. The old adapter does not copy that file into the Worker bundle, so the Worker crashed on startup and every route failed. A rollback did not help because the code it restored already had the bad pair. Cloudflare marked a deploy check failed on 2026-10-26, but merges continued. PR #287 moved the adapter to 1.20.12, which has the upstream fix. The site is live again._

> Related pull requests:
>
> - [chore(deps): bump the npm_and_yarn group with 3 updates - #278](https://github.com/rzkw/walkable/pull/278) - brought in the broken pair
> - [Show Medium posts and project images on first visit - #281](https://github.com/rzkw/walkable/pull/281) - reverted by #285
> - [Docs: add report for the first-visit Medium work - #282](https://github.com/rzkw/walkable/pull/282) - reverted by #285
> - [chore(deps): bump harden-runner - #283](https://github.com/rzkw/walkable/pull/283) - reverted by #285
> - [chore(deps): bump undici - #284](https://github.com/rzkw/walkable/pull/284) - reverted by #285
> - [Restore baseline before the feature updates - #285](https://github.com/rzkw/walkable/pull/285) - the rollback that did not fix the outage
> - [chore(deps): bump codeql upload-sarif - #286](https://github.com/rzkw/walkable/pull/286) - caused another deploy of the broken code
> - [Update OpenNext adapter to fix Next.js 16.4 Worker startup - #287](https://github.com/rzkw/walkable/pull/287) - the fix

# Cloudflare Worker Startup Failure - Incident Report (2026-10-29)

## At a glance

| Item             | Value                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Impact           | Every route returned HTTP 500 (Cloudflare error 1101). Visitors could not use the site.                                              |
| Start            | 2026-10-25 07:33 UTC, the deploy from PR #278                                                                                        |
| End              | 2026-10-29 01:33 UTC, the deploy from PR #287                                                                                        |
| Outage length    | 3 days, 18 hours                                                                                                                     |
| Root cause       | OpenNext 1.20.9 does not copy the Next.js 16.4 `preview-props.json` list file into the Worker, so the Worker crashes while it starts |
| Fix              | `@opennextjs/cloudflare` 1.20.9 to 1.20.12, plus a lockfile update                                                                   |
| App code changed | None                                                                                                                                 |
| Deploy check     | Red during the outage. PR #281 shows "❌ Deployment failed" with build logs. Merges still went ahead.                                |
| Live after fix   | Version `10c63611-3af0-4647-b024-a01ecb505630` (v792) took 100% of traffic                                                           |

## What visitors saw

A Cloudflare error page with code 1101. The Worker code threw an error before it could answer. The browser never reached the site.

The error inside Cloudflare was:

```
Error: Unexpected loadManifest(/.next/server/preview-props.json) call!
    at .open-next/server-functions/default/handler.mjs
    at getPreviewProps
    at new Server
    at __init (worker.js:13:58)
    at .open-next/worker.js:39:39
```

## Timeline (UTC)

| Time                   | Event                                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-25 07:33       | PR #278 merges. Next.js goes to 16.4.3. `@opennextjs/cloudflare` goes to 1.20.9.                                                               |
| 2026-10-25 07:xx       | Errors start. The 07:00 hour has 28 requests and 6 errors. The 08:00 hour has 23 requests and 23 errors. Every hour before 07:00 has 0 errors. |
| 2026-10-25 11:44       | A Workers Logs export shows the full error and stack trace.                                                                                    |
| 2026-10-26 03:30-06:20 | Cloudflare posts "❌ Deployment failed" with build logs on PR #281. Merges continue.                                                           |
| 2026-10-26 06:17       | PR #282 merges. Site still down.                                                                                                               |
| 2026-10-26 13:33       | PR #281 merges. Site still down.                                                                                                               |
| 2026-10-26 17:06-17:09 | PRs #283 and #284 merge. Site still down.                                                                                                      |
| 2026-10-27 04:08       | PR #285 merges a rollback to tree `88d20e9`. Deploy at 04:09. Site still down.                                                                 |
| 2026-10-27 17:10       | PR #286 merges an action pin. Deploy at 17:12 of the same broken code. Site still down.                                                        |
| 2026-10-28 11:30-13:25 | Fix branch written: plan, version choice, lockfile, adapter bump. PR #287 opened.                                                              |
| 2026-10-28 17:11-17:15 | PRs #289 and #291 merge action pins. Deploy at 17:20. Site still down.                                                                         |
| 2026-10-29 01:32       | PR #287 merges.                                                                                                                                |
| 2026-10-29 01:33       | New version rolls out to 100%. Errors stop.                                                                                                    |
| 2026-10-29 01:33-02:15 | 105 requests, 0 errors.                                                                                                                        |
| 2026-10-29 02:15       | Live pages fetched over the public domain. All normal, see checks below.                                                                       |

## Commits

The fix, merged as five commits. Each link goes to one commit.

| #   | Commit                                                                                        | Subject                                                     | Files                                              | Lines        |
| --- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- | ------------ |
| 1   | [`d75a641`](https://github.com/rzkw/walkable/commit/d75a64137fedd6d9f2150ce0356755f010bd4926) | Document the OpenNext fix for Next.js 16.4 Worker startup   | `plans/2026-10-28-fix-next-preview-props.md` (new) | +67          |
| 2   | [`fd2b5db`](https://github.com/rzkw/walkable/commit/fd2b5db1185a97334a931b438e31f1a0360f4295) | Choose the fixed OpenNext release allowed by npm age policy | plan file                                          | +6 / -5      |
| 3   | [`d08d59f`](https://github.com/rzkw/walkable/commit/d08d59fba5a3013aa94775572ca87a0523d7dd14) | Document the lockfile age-policy exception for Next.js      | plan file                                          | +3 / -1      |
| 4   | [`a1abcc0`](https://github.com/rzkw/walkable/commit/a1abcc0db3f156d38fdc9fcfa65ac897c40405e5) | Record the scoped glob override for the adapter update      | plan file                                          | +7 / -3      |
| 5   | [`add28ae`](https://github.com/rzkw/walkable/commit/add28ae364e4323f0c57d583253437ba986eb506) | Update OpenNext adapter for Next.js 16.4 manifest loading   | `package.json`, `package-lock.json`                | +775 / -1276 |

The rollback that did not fix the outage (PR #285):

| #   | Commit                                                                                        | Subject                                                      | Files | Lines      |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----- | ---------- |
| 1   | [`cf14afb`](https://github.com/rzkw/walkable/commit/cf14afbfbb5789ea49faf143ffc3e63d9e2ae0b1) | Restore the previous client-rendered homepage behavior       | 1     | +132 / -52 |
| 2   | [`c95329f`](https://github.com/rzkw/walkable/commit/c95329f1cf500c867ab57c78318c416e93cb39fc) | Restore the earlier Medium feed and project image API routes | 2     | +73 / -14  |
| 3   | [`c7ee6a6`](https://github.com/rzkw/walkable/commit/c7ee6a639976369f60714ff78e794aefc4b9c781) | Remove the Durable Object migration from the prior baseline  | 2     | -16        |
| 4   | [`fe9cf4a`](https://github.com/rzkw/walkable/commit/fe9cf4a038d976b76dc4c16ab1236c33db273af5) | Restore package versions from the selected baseline commit   | 2     | +39 / -39  |
| 5   | [`61384f7`](https://github.com/rzkw/walkable/commit/61384f7f3e15d8243b812b5fbf3c1fb65da407a4) | Restore earlier action pins in the core GitHub workflows     | 5     | +7 / -7    |
| 6   | [`c4de82e`](https://github.com/rzkw/walkable/commit/c4de82eff134275928a87d8bfb77e079e0ab03d0) | Restore the remaining GitHub workflow pins from baseline     | 3     | +3 / -3    |
| 7   | [`1545257`](https://github.com/rzkw/walkable/commit/15452572251f78b8dbe50f5b82a44570d1468f2e) | Remove the report created after the selected baseline commit | 1     | -172       |

## Root cause

Next.js 16.4 added a server file: `.next/server/preview-props.json`. It lists settings for preview mode. The server reads this file when it is created.

A build tool called OpenNext turns the Next.js app into a Cloudflare Worker. One of its build patches replaces every `loadManifest` call with data copied into the bundle. The patch has a fixed list of files it copies. On version 1.20.9 that list did not include `server/preview-props.json`. The call fell through to a throw, and the Worker stopped during startup.

Because the server is created when the Worker loads, the error came before any route ran. That is why every route failed, not just one.

Two facts prove this is the cause:

- Before the #278 deploy, every hour had 0 errors. From the 07:00 hour on 2026-10-25, every hour had errors. Nothing else changed at that time.
- The rollback in #285 restored tree `88d20e9`. That tree already had `next 16.4.3` and `@opennextjs/cloudflare 1.20.9`, because #278 landed before it. So the rollback restored the same broken pair.

The OpenNext project fixed this in [PR #1356](https://github.com/opennextjs/opennextjs-cloudflare/pull/1356), merged 2026-10-15. It adds `server/preview-props.json` to the bake-in list for Next 16.4 and later. The fix shipped in 1.20.12.

## The fix and why

Only two files changed:

- `package.json`: the adapter range goes from `^1.20.9` to `^1.20.12`.
- `package.json`: one `overrides` entry moves `@node-minify/core`'s `glob` from 10.3.3 to 10.5.0. The adapter pins 10.3.3, which has a high security warning.
- `package-lock.json`: refreshed. It pins 1.20.12.
- `next` stays at 16.4.3 and `body-parser` stays at 2.4.0. npm tried to move `body-parser` back to 2.3.0 during the lock refresh, which drops a security fix.

Why 1.20.12 and not 1.20.13:

- Both have the fix. 1.20.13 was published 2026-10-21 13:23 UTC. This repo's npm config only installs packages older than seven days. At the time of the work, 1.20.13 was inside that window, so npm refused it. 1.20.12 was published 2026-10-15 and was allowed.
- 1.20.12 is also the smaller step.

Why the feature work was not restored here:

- PR #285 removed the Medium feed and project image work. That work is separate from the outage. Putting it back in the same change would make it hard to tell what fixed the site. It needs its own PR.

## AI help vs human decisions

Decisions made by the human:

- Report the outage and share a Workers Logs export with trace `4a9b5f8f60941d53ecfc94efab194773`.
- Give the agent a Cloudflare API token with read access to Workers content and tail.
- Choose the rollback of the feature work (#285) as the first response.
- Choose a dependency-only PR before restoring any feature.
- Merge PR #287 to production and confirm the site on two devices.

Work done by the agent:

- Read the logs and matched the error to the adapter build patch. Found the upstream fix.
- Checked the rollback tree and found it had the same bad pair, which explained the failed rollback.
- Used the Cloudflare API for deploy history, versions, and request and error counts.
- Wrote the plan, the dependency change, the lockfile, and the checks.
- Wrote the PR body and this report.

One agent error during the work: the agent first said the deploys only uploaded versions and did not serve traffic. The deployments API showed version `07b23149` (v775) served 100% of traffic from 2026-10-27 04:09 to 17:12. The claim was wrong and was corrected.

## Bugs found

1. **OpenNext 1.20.9 does not copy the Next 16.4 preview-props file into the Worker.** The Worker throws at startup, so every route returns 500. Fixed by 1.20.12.
2. **The rollback did not check the dependency pair.** Tree `88d20e9` already had Next 16.4.3 with OpenNext 1.20.9. A rollback only helps if the target is known good.
3. **The deploy check was red, then green, and the site was still down.** On 2026-10-26 Cloudflare posted "❌ Deployment failed" with build logs on [PR #281](https://github.com/rzkw/walkable/pull/281#issuecomment-6407585552), and the `Workers Builds: walkable` check failed. Later PRs went green, because their bundles built, yet they shipped the same broken Worker. A green build only means the bundle was built.
4. **Wrong early diagnosis about deploys.** The agent said deploys were upload-only. The API showed a version served all traffic. Corrected in the PR.
5. **The npm age guard broke the lockfile step with a misleading error.** `npm install --package-lock-only` failed with `next@undefined`, because Next 16.4.3 was inside the seven-day hold. Fixed with a one-command exception for the already locked packages, without editing `.npmrc`.
6. **The adapter pins a vulnerable `glob`.** `@node-minify/core@9.0.2` pins `glob@10.3.3`, which has a high security warning. Fixed with a scoped override to 10.5.0.
7. **The lock refresh moved `body-parser` backwards.** It tried to go from 2.4.0 to 2.3.0 and drop a fix. Kept at 2.4.0.
8. **Generated folders are tracked in git.** `.open-next/` and `.wrangler/state/` are committed. A local build and preview changed 1,094 tracked files. They were restored before the commit.

## Tools used

Model used: **DeepSeek V4.1 Flash Free** on the **opencode** provider.

| Tool                                 | Version                             | Used for                                               |
| ------------------------------------ | ----------------------------------- | ------------------------------------------------------ |
| OpenCode                             | V2                                  | agent harness and worktree session                     |
| DeepSeek V4.1 Flash Free             | `opencode/deepseek-v4.1-flash-free` | investigation, plan, dependency change, checks, report |
| Node.js                              | 26.3.0                              | builds and scripts                                     |
| npm                                  | 11.16.0                             | install and audit                                      |
| npm                                  | 11.21.1                             | one lockfile update with a scoped age exception        |
| npm                                  | 10.9.2                              | check the lock against the CI npm version              |
| Next.js                              | 16.4.3                              | app build                                              |
| @opennextjs/cloudflare               | 1.20.9 to 1.20.12                   | Cloudflare build                                       |
| wrangler                             | 4.152.0                             | local Worker runtime through OpenNext preview          |
| gh CLI                               | 2.45.0                              | PR, checks, commits, API calls                         |
| git                                  | 2.43.0                              | branches, signed commits, rebase                       |
| Cloudflare API and GraphQL analytics | v4                                  | deploy history, versions, request and error counts     |
| curl                                 | 8.5.0                               | local runtime checks                                   |
| Harness HTTP client                  | -                                   | live page checks over the public domain                |

## Tests and checks

Run locally on 2026-10-28, before the PR was marked ready.

```
$ npm ci
added 754 packages, and audited 755 packages in 9s
6 vulnerabilities (4 moderate, 2 high)
```

Those 6 are the ones already on `main`. The same audit on `origin/main` gives 2 high (`undici`, `zod`) and 4 moderate. The change adds no new security warning.

```
$ npx opennextjs-cloudflare build
✓ Compiled successfully in 430ms
✓ Generating static pages using 3 workers (17/17) in 249ms
Worker saved in `.open-next/worker.js` 🚀
OpenNext build complete.
```

```
$ npx opennextjs-cloudflare preview
/ 200
/blog/ssh-hardening 200
/sitemap.xml 200
/robots.txt 200
/projects/old-laptop-server 200
preview-props-exception-not-observed
preview-props-manifest-inlined
```

`preview-props-manifest-inlined` means the generated `handler.mjs` now contains the file. The error text is gone.

```
$ npm ci --dry-run   # with npm 10.9.2, the version Workers Builds uses
added 131 packages in 698ms

$ git diff --check
(no output)
```

Pull request checks at merge time:

```
dependency-review  pass
Workers Builds     pass
CodeQL             pass
Netlify preview    pass
```

Production traffic, after the 01:33 UTC deploy:

```
version 10c63611  active, 100% traffic
2026-10-28 00:00 -> 2026-10-29 01:33   270 requests, 221 errors
2026-10-29 01:33 -> 2026-10-29 02:15   105 requests,   0 errors
```

Live site on 2026-10-29 02:15 UTC, through the public domain:

```
/                              200, full homepage
/blog/ssh-hardening            200, full post
/projects/old-laptop-server    200, full project
/sitemap.xml                   200, 11 URLs
/robots.txt                    200, expected rules
/api/medium-feed               200, 9 live Medium posts
/api/health                    404, no such route (the Worker answers normally)
```

The last row matters. A dead Worker returns 500 with error 1101. A healthy Worker answers an unknown route with 404.

Plain `curl` from the agent host gets HTTP 403 from the Cloudflare anti-bot check (`cf-mitigated: challenge`). That is a user check, not a site error. The live checks above used a web fetch client that the check does not block.

## What is still open

1. Make the Workers Builds check required for merge, and add a check after each deploy that requests a real page on the custom domain. A red deploy check was ignored, and a green one did not prove the site worked.
2. Do not roll back to a tree that has not been checked for its dependency pair.
3. Restore the Medium feed and project image work in its own PR, with a runtime check.
4. Add `.open-next/` and `.wrangler/` to `.gitignore` and untrack them.
5. Remove the `glob` override when `@node-minify/core` ships 10.5.0 or newer.

## References

- OpenNext Cloudflare, [Unexpected `loadManifest(preview-props.json)` call on Next.js 16.4 (#1448)](https://github.com/opennextjs/opennextjs-cloudflare/issues/1448) - the exact error and stack trace.
- OpenNext Cloudflare, [fix(patches): include preview-props.json in loadManifest glob (#1356)](https://github.com/opennextjs/opennextjs-cloudflare/pull/1356) - the upstream fix, merged 2026-10-15.
- npm, [`@opennextjs/cloudflare` registry metadata](https://registry.npmjs.org/@opennextjs%2fcloudflare) - versions 1.20.9, 1.20.12 and 1.20.13, with publish dates.
- Next.js source, `next/dist/server/route-modules/route-module.js` and `next/dist/server/web/get-edge-preview-props.js` - where the server reads preview props. Read from `node_modules` at 16.4.3.
- OpenNext source, `@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js` - the list of copied files and the error path. 1.20.9 lacks `preview-props.json`. 1.20.12 lists it for Next 16.4 and later.
- Cloudflare, [Workers error 1101](https://developers.cloudflare.com/workers/observability/errors/#1101) - the error that visitors saw.
- Cloudflare Workers bot, [deployment failed comment on PR #281](https://github.com/rzkw/walkable/pull/281#issuecomment-6407585552) - the red deploy check during the outage, with build logs.
- Cloudflare, [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/) and [GraphQL Analytics](https://developers.cloudflare.com/analytics/graphql-api/) - the error text and the request and error counts.
- Cloudflare, [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) - why merges of unrelated action pins deployed the same broken Worker again.
- npm, [`min-release-age`](https://docs.npmjs.com/cli/v11/using-npm/config#min-release-age) and [`min-release-age-exclude`](https://docs.npmjs.com/cli/v11/using-npm/config#min-release-age-exclude) - the seven-day hold and the one-command exception.
- npm, [`overrides` in package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#overrides) - the scoped `glob` fix.
- GitHub Advisory, [GHSA-5j98-mcp5-4vw2](https://github.com/advisories/GHSA-5j98-mcp5-4vw2) - glob CLI command injection, fixed in 10.5.0.
