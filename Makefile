.PHONY: help install typecheck build api-dev web-dev db-generate db-migrate db-reset

help:
	@echo "Available commands:"
	@echo "  make install      - install workspace dependencies"
	@echo "  make typecheck    - run workspace typecheck"
	@echo "  make build        - run workspace build"
	@echo "  make api-dev      - start API app"
	@echo "  make web-dev      - start web app"
	@echo "  make db-generate  - generate drizzle migrations"
	@echo "  make db-migrate   - apply drizzle migrations"
	@echo "  make db-reset     - regenerate migration folder from schema"

install:
	pnpm install --store-dir .pnpm-store/v10

typecheck:
	pnpm -w run typecheck

build:
	pnpm -w run build

api-dev:
	pnpm --filter @workspace/api-server run dev

web-dev:
	pnpm --filter @workspace/pk-store run dev

db-generate:
	bash scripts/db.sh generate

db-migrate:
	bash scripts/db.sh migrate

db-reset:
	bash scripts/db.sh reset

