import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let pool: pg.Pool | undefined;
let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }
  return url;
}

export function getPool() {
  if (!pool) pool = new Pool({ connectionString: requireDatabaseUrl() });
  return pool;
}

export function getDb() {
  if (!db) db = drizzle(getPool(), { schema });
  return db;
}

export * from "./schema";
