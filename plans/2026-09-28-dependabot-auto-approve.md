# Dependabot Minor/Patch Auto-Approval Implementation Plan

> **For agentic workers:** Use the executing-plans workflow to complete these steps. Check off each step as you finish it.

**Goal:** Approve open and future Dependabot minor/patch pull requests, then enable squash auto-merge so GitHub merges them only after all required checks and branch rules pass.

**Architecture:** Update the existing workflow to handle individual Dependabot PR events and a manually dispatched backlog sweep. The event path uses Dependabot metadata; the sweep first runs in dry-run mode and classifies open PRs from Dependabot's commit metadata. Both paths approve eligible PRs and queue auto-merge without checking out or executing PR code.

**Tech Stack:** GitHub Actions, `dependabot/fetch-metadata@v3`, GitHub CLI, GitHub REST API.

**Spec:** Approved chat decision, 2026-09-28: approval plus squash auto-merge after required checks pass; do not bypass checks or branch rules.

## Global Constraints

- Act only on open PRs authored by `dependabot[bot]`.
- Approve and queue auto-merge only when the highest update type is semver-minor or semver-patch. Skip major, unknown, and missing metadata.
- Preserve GitHub's required checks, review rules, and merge protections. Do not force a merge or bypass requirements.
- Use `pull_request_target` only with an explicit Dependabot-author check. Do not check out or execute PR-head code in the write-token job.
- The administrator must confirm **Allow GitHub Actions to create and approve pull requests** is enabled. If branch rules reject approvals from `github-actions[bot]`, stop and obtain an approved GitHub App-token approach; do not weaken required review rules.
- Manual backlog processing defaults to dry-run. Review its candidate list before a separate apply run.

## Review Focus

- Major or unknown updates must not be approved or queued; covered by the dry-run inventory check.
- Grouped updates must use the highest semver update type; covered by the grouped PR #176 metadata check and the scanner's classification output.
- Non-Dependabot PRs must not reach write steps; covered by actionlint and the explicit author guard.
- Existing approvals must not be posted again; covered by checking the PR's review decision before approving.
- Failed checks must keep auto-merge pending; covered by the #182 blocked-check verification and GitHub auto-merge state.

---

## Current Open PR Inventory

Snapshot checked 2026-09-28. These are the PRs the backfill must classify from their latest Dependabot commit metadata. Check states can change before the backfill runs.

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

## Task 1: Repair and harden the individual-PR workflow

**Files:**

- Modify: `.github/workflows/dependabot-auto-approve.yml`

### Steps

- [ ] **Step 1: Trigger on Dependabot PR updates**

Use `pull_request_target` for `opened`, `reopened`, and `synchronize`. Gate the job on `github.event.pull_request.user.login == 'dependabot[bot]'`, rather than the event actor, so a maintainer reopening a Dependabot PR does not skip processing.

- [ ] **Step 2: Keep the write-token job from running PR code**

Keep `pull-requests: write` and `contents: write`, which the review and auto-merge operations require. Retain the current `automerged` label operation; successful runs have already performed it with these permissions. Remove the checkout step; metadata and `gh` operations do not need repository files. Do not add commands that install dependencies or execute the PR head.

- [ ] **Step 3: Approve eligible updates before enabling auto-merge**

Continue using `dependabot/fetch-metadata@v3`. For `version-update:semver-minor` and `version-update:semver-patch`, check `reviewDecision`; submit `gh pr review --approve` only when the PR is not already approved, then run `gh pr merge --auto --squash` and retain the existing `automerged` label.

- [ ] **Step 4: Remove the failing, nonessential comment call**

Remove the `Comment on PR` step. Its API request currently omits `issue_number`, causing `/issues//comments` and failing otherwise successful runs. The comment is not needed for approval or merge behavior.

- [ ] **Step 5: Validate the workflow file**

Run `actionlint .github/workflows/dependabot-auto-approve.yml`. Fix any syntax, expression, permission, or event errors before continuing. `actionlint` is not installed in the current workspace; use the standalone tool and do not add it as an application dependency.

## Task 2: Add a safe backlog sweep

**Files:**

- Modify: `.github/workflows/dependabot-auto-approve.yml`

### Steps

- [ ] **Step 1: Add a manual dispatch input**

Add `workflow_dispatch` with a boolean `dry_run` input defaulting to `true`.

- [ ] **Step 2: List open Dependabot PRs and classify without mutation**

For dispatch runs, list open PRs authored by `dependabot[bot]`, read their latest commit messages through the GitHub API, and collect all `update-type: version-update:semver-*` entries. Rank `patch < minor < major`; use the highest type for grouped updates to match `fetch-metadata`. Log each PR number and classification. Unknown or absent metadata must be skipped. In dry-run mode, do not approve, label, comment, or queue any PR.

- [ ] **Step 3: Apply the same guarded operations on a non-dry-run dispatch**

When an administrator dispatches with `dry_run: false`, approve eligible PRs only if they are not already approved, then queue squash auto-merge and add the existing `automerged` label. Never process majors or unknown types. Do not create a comment API call.

- [ ] **Step 4: Verify the dry-run candidate inventory before applying**

Run the dispatch with the default `dry_run: true`. At this snapshot, expected eligible PRs are #143, #156, #176, #179, and #182; expected major skips are #155 and #203. Compare the run output to live Dependabot metadata. Re-read the inventory before the apply dispatch because PRs and check states can change.

- [ ] **Step 5: Apply and verify**

After reviewing the dry-run output and confirming the Actions approval setting, dispatch with `dry_run: false`. Verify eligible PRs show an approval and an auto-merge request. Confirm #155 and #203 remain untouched. Confirm #182 stays open while its required CodeQL checks fail; do not override those failures.

## Admin prerequisite and separate label warning

- Confirm the repository Actions setting **Allow GitHub Actions to create and approve pull requests** is enabled. This setting could not be inspected through the current API token.
- The repository's `.github/dependabot.yml` refers to a `github-actions` label that Dependabot reports as missing. Create that repository label before the next Actions dependency PR, or remove the invalid label entry separately. This warning does not block the approval workflow or the listed PRs.
- The current `allow_auto_merge` and `allow_squash_merge` repository settings are both enabled.

## Final verification and PR

- [ ] Run `actionlint .github/workflows/dependabot-auto-approve.yml`; expected: no findings.
- [ ] Run `git diff --check`; expected: no whitespace errors.
- [ ] Run `npm run build`; expected: production build succeeds. The website is not changed, but repository policy requires a build check before every PR.
- [ ] Include the exact test commands and their outputs in the implementation PR description.
- [ ] Run Ponytail review on the implementation diff before its PR.

## References

- [Dependabot Fetch Metadata Action README](https://github.com/dependabot/fetch-metadata) — defines `update-type`, explains grouped updates use the highest semver change, and documents Dependabot auto-approval and auto-merge examples.
- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) — documents `pull_request_target`, `workflow_dispatch`, and token permissions.
- [Events that trigger workflows: `pull_request_target`](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request_target) — documents its base-branch security context and safe-use constraints.
- [Managing GitHub Actions settings for a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository) — documents the setting that allows Actions to create and approve pull requests.
- [Create a review for a pull request](https://docs.github.com/en/rest/pulls/reviews#create-a-review-for-a-pull-request) — documents the approval API operation and permission errors.
- [Managing auto-merge for pull requests](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository) — auto-merge waits for merge requirements to be met.
- [actionlint](https://github.com/rhysd/actionlint) — workflow YAML and expression validator.
- Repository evidence: `.github/workflows/dependabot-auto-approve.yml`; `.github/dependabot.yml`; workflow history commits `ca8cc58` (changed scheduled backlog scan to PR events) and `7231c26` (removed manual dispatch); open PR metadata and checks linked in the inventory above.
