# Contributing

Thanks for helping improve this project.

## Before you open a PR

1. **Secrets:** Do not commit `.env`, API keys, tokens, or personal data. Use `.env.example` for new variables (placeholders only).
2. **Scope:** Keep changes focused on one concern (feature, fix, or docs) when possible.
3. **Checks:** From the repo root after `pnpm install`:
   - `pnpm -w run typecheck`
   - `pnpm -w run build`  
   Fix failures before requesting review.

## Pull requests

- Describe **what** changed and **why** (user-visible behavior or risk).
- Link related issues if any.
- If you change env vars or deployment steps, update **`DEPLOYMENT.md`** or **`docs/deploy/`** in the same PR.

## Security

See **[SECURITY.md](./SECURITY.md)** for how to report vulnerabilities and how we handle secrets.

## Code style

Match existing formatting; Prettier is available at the workspace root. Avoid drive-by refactors unrelated to your change.
