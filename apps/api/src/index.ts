import { sql } from "drizzle-orm";
import app from "./app";
import { db } from "./db/index";
import { runMigrations } from "./db/migrate";
import { seedDatabase } from "./db/seed";
import { usersTable } from "./db/schema";
import { logger } from "./lib/logger";
import { startScheduler } from "./services/scheduler";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function isUsersTableEmpty(): Promise<boolean> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(usersTable);
  return Number(row?.n ?? 0) === 0;
}

async function start() {
  await runMigrations();

  if (await isUsersTableEmpty()) {
    logger.info("Users table is empty — running database seed");
    await seedDatabase();
  } else {
    logger.info("Users table is not empty — skipping seed");
  }
}

async function main() {
  try {
    await start();
  } catch (err) {
    logger.error({ err }, "Startup failed (migrations or seed)");
    process.exit(1);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
    startScheduler();
  });
}

main();
