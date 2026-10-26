# AGENTS.md — rzkw/walkable

Next.js website for Walkable LLC. Deployed to Cloudflare Workers and Docker.

## Problem solving

When suggesting solutions, problem solving, or implementing changes - always strive for the simplest possible solution that works. Avoid overengineering, overcomplicating, building unnecessarily difficult solutions.

## Git Rules

- **Never force push.** `git push --force` is forbidden on any branch. Use `--force-with-lease` when necessary. Add new commits only.
- **Always rebase, never merge.** Keep a linear history. Use `git pull --rebase` to incorporate upstream changes.
- **Rebase before every push.** Rebasing onto the target branch before pushing avoids merge conflicts.

## Commit signing

All commits must be signed with SSH key `~/.ssh/agent-gh-signing`. Git is configured globally (`gpg.format = ssh`, `user.signingkey = ~/.ssh/agent-gh-signing.pub`, `commit.gpgsign = true`). Verify with `git log --show-signature -1` before pushing.

## Commits

- Break work into small, atomic commits. One logical change per commit.
- Touch no more than 5 files per commit.
- Keep the subject line, including the `[ai-assisted]` tag, between 50 and 80 characters.
- Use the imperative mood in the subject.
- Explain why you made the change in the body, not only what changed.
- Mark AI help in the subject with `[ai-assisted]`. Then say what AI did and what you decided. Example:

  ```
  feat(auth): add refresh token rotation [ai-assisted]
  AI helped with: starter code, test cases
  Human decisions: token length, where to store it
  ```

- Each commit must build on its own, so any commit can be reverted alone.

## Writing and code review

- Use simple English in pull request titles, descriptions, comments and replies, documentation, and conversation threads. Keep sentences short and direct. Avoid jargon and filler.
- Before submitting a pull request with code changes, run Ponytail's `/ponytail-review` on the diff. Remove code only when the requested behavior and its checks remain intact. If Ponytail is not available, install it globally first.

## Testing before PR

- **Always test before submitting a PR, regardless of content** (code, plans, references, etc).
- Run the exact commands and include the commands + their output in the PR description.
- For non-code changes (docs, plans), verify whatever is verifiable (e.g. `git diff --stat`, build succeeds, config parses).
- Skip `npm run build` for changes that do not affect the website (e.g. workflows, docs, plans). For workflow changes run `actionlint` instead. Always run `git diff --check`.

# Walkable LLC — Project Instructions

## Planning

- All plans live in `plans/` directory as markdown files.
- Always commit and push plan to GitHub before implementation begins.
- One plan file per phase or feature.
- All plans and reports MUST include a References section citing sources for every design decision (libraries, services, runtime behavior, security controls). Acceptable sources: official product documentation, personal blogs from engineers/devs/sysadmins, and product engineering blogs. Academic papers are never acceptable.
