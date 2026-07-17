# AGENTS.md — rzkw/walkable

Next.js website for Walkable LLC. Deployed to Cloudflare Workers and Docker.

## Git Rules

- **Never force push.** `git push --force` and `--force-with-lease` are forbidden on any branch. Add new commits only.
- **Always rebase, never merge.** Keep a linear history. Use `git pull --rebase` to incorporate upstream changes.
- **Rebase before every push.** Rebasing onto the target branch before pushing avoids merge conflicts.

## Commit signing

All commits must be signed with SSH key `~/.ssh/agent-gh-signing`. Git is configured globally (`gpg.format = ssh`, `user.signingkey = ~/.ssh/agent-gh-signing.pub`, `commit.gpgsign = true`). Verify with `git log --show-signature -1` before pushing.
