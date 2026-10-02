# Dependabot Backfill Report: Approve and Auto-merge Minor and Patch PRs

**Date:** 2026-10-02
**Workflow PR:** #211 (merged 2026-10-02). The workflow handles new PR events only. This report covers the one-time backlog run from Task 2 of `plans/2026-09-28-dependabot-auto-approve.md`.

## Pre-run state

8 open Dependabot PRs. Classification came from `update-type: version-update:semver-*` tags in each PR's commit-message footer. Grouped PRs carry no tags, so #222 was checked by eye against its version bumps.

| PR   | Change                                                                                      | Tag                              | Decision          |
| ---- | ------------------------------------------------------------------------------------------- | -------------------------------- | ----------------- |
| #222 | npm group: next 16.3.5 to 16.3.8, brace-expansion 1.1.18 to 1.1.21, undici 7.29.0 to 7.29.1 | none (grouped, all patch by eye) | Approve and queue |
| #219 | motion 12.38.0 to 13.4.3                                                                    | semver-major                     | Skip              |
| #182 | codeql-action/analyze 4.36.2 to 4.37.9                                                      | semver-minor                     | Approve and queue |
| #179 | codeql-action/upload-sarif 4.36.2 to 4.37.9                                                 | semver-minor                     | Approve and queue |
| #176 | react and @types/react (2x patch tags)                                                      | semver-patch                     | Approve and queue |
| #156 | actions/checkout 7.0.0 to 7.0.1                                                             | semver-patch                     | Approve and queue |
| #155 | actions/setup-node 6.4.0 to 7.0.0                                                           | semver-major                     | Skip              |
| #143 | setup-buildx-action 4.1.0 to 4.2.0                                                          | semver-minor                     | Approve and queue |

Note: #222 already had auto-merge queued and the `automerged` label from the pre-fix workflow run. It still needed an approval, so it stayed in the backlog.

## Apply commands

Dry-run (read-only):

```bash
for n in $(gh pr list --author "app/dependabot" --state open --json number --jq '.[].number'); do
  tags=$(gh api repos/rzkw/walkable/pulls/$n/commits --jq '[.[].commit.message] | join("\n")' | grep -o 'semver-[a-z]*' | sort -u | tr '\n' ' ');
  echo "PR #$n: ${tags:-NO TAGS (grouped - check versions by eye)}";
done
```

Apply (after review of dry-run output):

```bash
for n in 222 182 179 176 156 143; do
  gh pr review $n --approve && gh pr merge $n --auto --squash && gh pr edit $n --add-label automerged;
done
```

## Post-run state

All 6 eligible PRs: approved, squash auto-merge queued, `automerged` label present. Both majors untouched.

| PR   | Approved   | Auto-merge | Label      | Merge state        |
| ---- | ---------- | ---------- | ---------- | ------------------ |
| #222 | yes        | queued     | automerged | BEHIND             |
| #182 | yes        | queued     | automerged | BEHIND             |
| #179 | yes        | queued     | automerged | BEHIND             |
| #176 | yes        | queued     | automerged | DIRTY (conflicted) |
| #156 | yes        | queued     | automerged | BEHIND             |
| #143 | yes        | queued     | automerged | BEHIND             |
| #219 | no (major) | no         | npm only   | BEHIND             |
| #155 | no (major) | no         | none       | BEHIND             |

## Findings

- Approvals are attributed to the operator account (`agent-walkllc`), not `github-actions[bot]`, because the backfill ran through local `gh` auth. This is fine. Ruleset `main` needs 0 approvals.
- #176 is conflicted (DIRTY, not rebaseable through the API). Auto-merge can never complete on it. Dependabot refreshes its own branches on schedule, which should clear this. If it lingers, close and let Dependabot reopen it.
- The other 5 are BEHIND. Strict status checks need branches up to date before merge. Dependabot rebases its own PRs itself. Auto-merge fires after that.
- #182 has failing CodeQL checks. It stays open until they pass, by design. Do not force it.
- Tie-break rule used: none needed today (no mixed tags). Rule stands: highest wins, major over minor over patch.

## References

- [PR #211](https://github.com/rzkw/walkable/pull/211) — merged workflow this backfill follows.
- [TheRoks: Automating Dependabot Minor and Patch Updates](https://theroks.com/automating-dependabot-minor-patch-updates/#option-2-github-actions--dependabotfetch-metadata) — event-based metadata filter used by the workflow.
- [Dependabot Fetch Metadata Action README](https://github.com/dependabot/fetch-metadata) — `update-type` values and grouped-update highest-semver rule.
- [Managing auto-merge for pull requests](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository) — auto-merge waits for merge requirements.
- Plan: `plans/2026-09-28-dependabot-auto-approve.md` (Task 2).
