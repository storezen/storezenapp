# Security policy

## Supported versions

Security fixes are applied to the default branch (`main`) for this monorepo. Deploy from `main` or from a release tag cut from `main`.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for undisclosed security problems.

1. Open a **private vulnerability report**:  
   Repository → **Security** tab → **Report a vulnerability**  
   (GitHub [private reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) if enabled on the repo.)

2. If that option is unavailable, email the maintainer via the contact on their [GitHub profile](https://github.com/hassanarif426) and include:
   - short description and impact
   - steps to reproduce (minimal)
   - suggested fix (optional)

We aim to acknowledge within a few business days. Coordinated disclosure is preferred.

## Secrets and configuration

- **Never commit** real `.env` files, API keys, JWT secrets, database passwords, or TLS private keys. Only commit **`.env.example`** (placeholders).
- Rotate any credential that was ever committed or pasted in a ticket/chat, even if the commit was reverted.
- Production **must** use strong values for `JWT_SECRET`, `ADMIN_PASSWORD`, database credentials, and third-party API keys — set these in your host (Vercel / Railway / etc.), not in source.

## Demo / storefront defaults

The web app may ship with **demo** defaults (for example a simple admin password in local config). Treat these as **non-production**; change them before going live and restrict admin access appropriately.

## Dependency updates

Dependency updates are automated via [Dependabot](.github/dependabot.yml). Review PRs before merge and run CI.

## Scope

This policy covers this repository and its released artifacts. Third-party services (hosting, payment, couriers, messaging) follow their own security programs.
