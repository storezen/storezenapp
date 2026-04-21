# Standard Folder Structure

This document defines the standard structure for future development. Existing code can be moved gradually to avoid breaking changes.

## Monorepo

- `apps/` -> deployable applications
- `packages/` -> shared libraries and contracts
- `scripts/` -> automation and maintenance scripts
- `docs/` -> technical documentation and architecture decisions

## Frontend App Standard (`apps/web/src`)

- `app/` -> application shell, router setup, providers, entry composition
- `features/` -> feature-first modules (cart, checkout, admin, tracking)
- `entities/` -> business entities (product, order, collection, customer)
- `shared/` -> reusable cross-feature code
  - `shared/components/` -> generic UI wrappers used by multiple features
  - `shared/hooks/` -> reusable hooks
  - `shared/lib/` -> utility logic
  - `shared/utils/` -> pure helper functions
  - `shared/api/` -> API clients and query adapters
  - `shared/config/` -> environment and runtime config
  - `shared/types/` -> shared TypeScript types/interfaces
  - `shared/styles/` -> global styles, tokens, design constants
- `tests/`
  - `tests/unit/`
  - `tests/integration/`
  - `tests/e2e/`

## Backend App Standard (`apps/api/src`)

- `config/` -> env parsing, server config, logger config
- `controllers/` -> request/response layer
- `services/` -> business logic orchestration
- `repositories/` -> DB access and query composition
- `validators/` -> request schema validation and parsing
- `routes/` -> route registration and grouping
- `middlewares/` -> express middleware chain
- `types/` -> backend-specific types
- `utils/` -> pure helper utilities
- `tests/`
  - `tests/unit/`
  - `tests/integration/`

## Migration Rules

1. Move code by feature, not by random file batches.
2. Keep old imports working until each feature is fully migrated.
3. Prefer small PRs: one feature or one layer per PR.
4. Add tests in the same PR when moving behavior-heavy logic.
5. Update this document when structure conventions change.
