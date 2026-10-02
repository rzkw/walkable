# Dependabot Minor/Patch Auto-Approval Implementation Plan

> **For agentic workers:** Use the executing-plans workflow to complete these steps. Check off each step as you finish it.

**Goal:** Approve open and future Dependabot minor/patch pull requests, then enable squash auto-merge so GitHub merges them only after all required checks and branch rules pass.

**Architecture:** Follow TheRoks Option 2: handle Dependabot PR events with `dependabot/fetch-metadata`, approve only minor/patch updates, and queue auto-merge. Process the already-open backlog once after the workflow PR merges using a local dry-run/apply; do not add a permanent scanner or dispatch job.

**Tech Stack:** GitHub Actions, `dependabot/fetch-metadata@v3`, GitHub CLI, GitHub REST API.

**Spec:** Approved chat decision, 2026-09-28: approval plus squash auto-merge after required checks pass; do not bypass checks or branch rules.

## Global Constraints

- Act only on open PRs authored by `dependabot[bot]`.
- Approve and queue auto-merge only when the highest update type is semver-minor or semver-patch. Skip major, unknown, and missing metadata.
- Preserve GitHub's required checks, review rules, and merge protections. Do not force a merge or bypass requirements.
- Use `pull_request` events as in the article. The repository owner confirmed **Allow GitHub Actions to create and approve pull requests** is enabled, and recent runs received the required write permissions.
- Do not check out or execute PR-head code; the workflow uses only Dependabot metadata and GitHub CLI/API operations.
- Do not bypass required checks or branch rules. If branch protection does not accept the bot approval, leave auto-merge pending.
- Run the existing-PR backfill once after merge: dry-run, inspect eligible PRs, then apply. Do not commit a recurring scanner.

## Review Focus

- Major or unknown updates must not be approved or queued; covered by metadata conditions and the one-time dry-run inventory.
- Grouped updates must use the highest semver update type; covered by `fetch-metadata` and the grouped PR #176 inventory check.
- Non-Dependabot PRs must not reach write steps; covered by the actor guard and actionlint.
- An existing bot approval for the same head must not be posted again; covered by the approval-guard regression check.
- Failed checks must keep auto-merge pending; covered by the #182 blocked-check verification and GitHub auto-merge state.

---

## Current Open PR Inventory

Snapshot checked 2026-09-28. These are the PRs the one-time post-merge dry-run should classify from their latest Dependabot commit metadata. Check states can change before it runs.

| PR                                                | Update                                                     | Plan                                                 | Latest observed checks                                                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [#143](https://github.com/rzkw/walkable/pull/143) | `docker/setup-buildx-action` 4.1.0 → 4.2.0, minor          | Approve and queue auto-merge                         | Last reported checks succeeded, but are from July; re-check current mergeability/checks                                                         |
| [#155](https://github.com/rzkw/walkable/pull/155) | `actions/setup-node` 6.4.0 → 7.0.0, major                  | Skip                                                 | Not eligible                                                                                                                                    |
| [#156](https://github.com/rzkw/walkable/pull/156) | `actions/checkout` 7.0.0 → 7.0.1, patch                    | Approve and queue auto-merge                         | Last reported checks succeeded                                                                                                                  |
| [#176](https://github.com/rzkw/walkable/pull/176) | `react` and `@types/react`, patch metadata                 | Approve and queue auto-merge                         | Last reported checks succeeded                                                                                                                  |
| [#179](https://github.com/rzkw/walkable/pull/179) | `github/codeql-action/upload-sarif` 4.36.2 → 4.37.9, minor | Approve and queue auto-merge                         | Last reported checks succeeded                                                                                                                  |
| [#182](https://github.com/rzkw/walkable/pull/182) | `github/codeql-action/analyze` 4.36.2 → 4.37.9, minor      | Approve and queue auto-merge; do not bypass failures | `Analyze (actions)` and `Analyze (javascript-typescript)` failed on the latest observed run; it will remain unmerged until required checks pass |
| [#203](https://github.com/rzkw/walkable/pull/203) | `motion` 12.38.0 → 13.4.0, major                           | Skip                                                 | Not eligible                                                                                                                                    |

The repository currently reports auto-merge and squash merge enabled. A previous run failed because squash merging was disabled at that time; this setting does not currently need changing.

## Task 1: Keep the event workflow close to the article

**Files:**

- Modify: `.github/workflows/dependabot-auto-approve.yml`

### Steps

- [ ] **Step 1: Trigger on Dependabot PR updates**

Use `pull_request` for `opened`, `synchronize`, `reopened`, and `ready_for_review`, as shown in TheRoks Option 2. Keep the Dependabot actor guard.

- [ ] **Step 2: Keep the write-token job from running PR code**

Keep `pull-requests: write` and `contents: write`. Retain the existing harden-runner step and `automerged` label. Do not check out the repository; metadata and `gh` operations do not need files.

- [ ] **Step 3: Approve eligible updates before enabling auto-merge**

Continue using the pinned `dependabot/fetch-metadata` action. For `version-update:semver-minor` and `version-update:semver-patch`, run `gh pr review --approve` unconditionally before `gh pr merge --auto --squash`. Do not check for an existing bot approval first; a duplicate approval changes no state, and `synchronize` pushes re-approve the new head. Use only `PR_NUMBER`.

- [ ] **Step 4: Fix the comment API call**

Keep the article's comment step and pass `issue_number: context.issue.number`. The current workflow omitted this field, which caused the `/issues//comments` 404 after auto-merge had already been enabled. Pass `update-type` via `UPDATE_TYPE` env and set the body to `Auto-merge enabled for minor update...` or `...patch update...` with a one-line JS ternary. Branch protection ruleset `main` requires 0 approvals, so approval is not a merge gate; strict CodeQL checks still gate the merge.

- [ ] **Step 5: Validate the workflow file**

Run `actionlint .github/workflows/dependabot-auto-approve.yml`. Fix any syntax, expression, permission, or event errors before continuing. `actionlint` is not installed in the current workspace; use the standalone tool and do not add it as an application dependency.

## Task 2: Process the existing backlog once after merge

**Files:** None. This is a one-time operator run after Task 1 is merged to `main`.

### Steps

- [ ] **Step 1: Recheck the open PR inventory**

Use `gh pr list --author app/dependabot --state open` and read each latest Dependabot commit message. Do not add `workflow_dispatch`, a scheduled scan, or a committed backfill script.

- [ ] **Step 2: Dry-run classification without mutation**

Collect all `update-type: version-update:semver-*` entries and rank `patch < minor < major`, using the highest type for grouped updates. Print eligible and skipped PR numbers. Do not approve, label, comment, or queue any PR during the dry-run.

- [ ] **Step 3: Apply once after reviewing the dry-run**

After comparing the output to current metadata, approve eligible minor/patch PRs and run `gh pr merge --auto --squash`; add the existing `automerged` label. Do not process major, unknown, or missing metadata. This local operation is run once; it is not part of the ongoing workflow.

- [ ] **Step 4: Verify the dry-run candidate inventory before applying**

At this snapshot, expected eligible PRs are #143, #156, #176, #179, and #182; expected major skips are #155 and #203. Re-read the inventory and statuses before applying because they can change.

- [ ] **Step 5: Apply and verify**

Verify eligible PRs show an approval and auto-merge request. Confirm #155 and #203 remain untouched. Confirm #182 stays open while its required CodeQL checks fail; do not override those failures.

## Admin prerequisites

- The repository owner confirmed **Allow GitHub Actions to create and approve pull requests** is enabled and the existing `automerged` label is present.
- The current `allow_auto_merge` and `allow_squash_merge` repository settings are both enabled.

## Final verification and PR

- [ ] Run `actionlint .github/workflows/dependabot-auto-approve.yml`; expected: no findings.
- [ ] Run `git diff --check`; expected: no whitespace errors.
- [ ] Run `npm run build`; expected: production build succeeds. The website is not changed, but repository policy requires a build check before every PR.
- [ ] Include the exact test commands and their outputs in the implementation PR description.
- [ ] Run Ponytail review on the implementation diff before its PR.

## References

- [Dependabot Fetch Metadata Action README](https://github.com/dependabot/fetch-metadata) — defines `update-type`, explains grouped updates use the highest semver change, and documents Dependabot auto-approval and auto-merge examples.
- [TheRoks: Automating Dependabot Minor and Patch Updates](https://theroks.com/automating-dependabot-minor-patch-updates/#option-2-github-actions--dependabotfetch-metadata) — explains the event-based metadata filter, CI gate, permissions, and auto-merge tradeoffs used here.
- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) — documents `pull_request` events and token permissions.
- [Events that trigger workflows: `pull_request`](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request) — documents supported pull request activity types.
- [Managing GitHub Actions settings for a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository) — documents the setting that allows Actions to create and approve pull requests.
- [Create a review for a pull request](https://docs.github.com/en/rest/pulls/reviews#create-a-review-for-a-pull-request) — documents the approval API operation and permission errors.
- [Managing auto-merge for pull requests](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository) — auto-merge waits for merge requirements to be met.
- [actionlint](https://github.com/rhysd/actionlint) — workflow YAML and expression validator.
- Repository evidence: `.github/workflows/dependabot-auto-approve.yml`; `.github/dependabot.yml`; workflow history commits `ca8cc58` (changed scheduled backlog scan to PR events) and `7231c26` (removed manual dispatch); open PR metadata and checks linked in the inventory above.
