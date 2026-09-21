import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool";

const migrationsDirectory = path.resolve(process.cwd(), "src/db/migrations");

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name varchar(255) PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const name of migrationFiles) {
      const existingMigration = await client.query(
        "SELECT 1 FROM schema_migrations WHERE name = $1",
        [name],
      );

      if (existingMigration.rowCount) {
        continue;
      }

      const sql = await readFile(path.join(migrationsDirectory, name), "utf8");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        name,
      ]);
      console.log(`Applied migration: ${name}`);
    }

    await client.query("COMMIT");
    console.log("Database is up to date");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error("Migration failed", error);
  process.exitCode = 1;
});