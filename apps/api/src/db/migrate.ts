import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";

async function run() {
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migrations completed successfully.");
}

run()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Migration failed:", error);
    await pool.end();
    process.exit(1);
  });
