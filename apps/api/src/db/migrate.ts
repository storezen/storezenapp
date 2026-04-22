import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { logger } from "../lib/logger";
import { db, pool } from "./index";

/**
 * Apply all pending Drizzle SQL migrations from `apps/api/drizzle/`.
 * Uses `process.cwd()` so it works when started as `node dist/index.mjs` from the package root (e.g. Railway).
 */
export async function runMigrations(): Promise<void> {
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  logger.info({ migrationsFolder }, "Running Drizzle migrations");
  try {
    await migrate(db, { migrationsFolder });
    logger.info("Drizzle migrations completed successfully");
  } catch (err) {
    logger.error({ err, migrationsFolder }, "Drizzle migrations failed");
    throw err;
  }
}

/** CLI: `pnpm run db:migrate:run` */
async function runCli() {
  try {
    await runMigrations();
  } finally {
    await pool.end();
  }
}

const isMigrateCli =
  typeof process.argv[1] === "string" &&
  (process.argv[1].includes("migrate") || process.argv[1].endsWith("migrate.ts"));

if (isMigrateCli) {
  runCli()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
