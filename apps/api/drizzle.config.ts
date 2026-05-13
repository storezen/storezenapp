import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Drizzle config");
}

/** Fails fast when the host is unreachable (libpq / node-pg). */
function withConnectTimeout(urlStr: string, seconds = 15) {
  try {
    const u = new URL(urlStr);
    if (!u.searchParams.has("connect_timeout")) {
      u.searchParams.set("connect_timeout", String(seconds));
    }
    return u.toString();
  } catch {
    return urlStr;
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: withConnectTimeout(process.env.DATABASE_URL, Number(process.env.PG_CONNECT_TIMEOUT_SEC ?? 15) || 15),
  },
});

