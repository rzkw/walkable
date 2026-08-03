# AGENTS.md — rzkw/walkable

Next.js website for Walkable LLC. Deployed to Cloudflare Workers and Docker.

## Git Rules

- **Never force push.** `git push --force` is forbidden on any branch. Use `--force-with-lease` when necessary. Add new commits only.
- **Always rebase, never merge.** Keep a linear history. Use `git pull --rebase` to incorporate upstream changes.
- **Rebase before every push.** Rebasing onto the target branch before pushing avoids merge conflicts.

## Commit signing

All commits must be signed with SSH key `~/.ssh/agent-gh-signing`. Git is configured globally (`gpg.format = ssh`, `user.signingkey = ~/.ssh/agent-gh-signing.pub`, `commit.gpgsign = true`). Verify with `git log --show-signature -1` before pushing.

# Walkable LLC — Project Instructions

## Planning

- All plans live in `plans/` directory as markdown files.
- Always commit and push plan to GitHub before implementation begins.
- One plan file per phase or feature.
- All plans and reports MUST include a References section citing sources for every design decision (libraries, services, runtime behavior, security controls). Acceptable sources: official product documentation, personal blogs from engineers/devs/sysadmins, and product engineering blogs. Academic papers are never acceptable.
