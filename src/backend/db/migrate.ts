import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveBackendConfig } from "../config/env";
import { createPostgresPool } from "./PostgresPool";

interface MigrationRow {
  name: string;
}

const migrationDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "migrations",
);

async function ensureMigrationTable(
  pool: ReturnType<typeof createPostgresPool>,
): Promise<void> {
  await pool.query(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);
}

async function getAppliedMigrations(
  pool: ReturnType<typeof createPostgresPool>,
): Promise<Set<string>> {
  const result = await pool.query<MigrationRow>(
    "select name from schema_migrations",
  );
  return new Set(result.rows.map((row) => row.name));
}

async function run(): Promise<void> {
  const config = resolveBackendConfig();
  const pool = createPostgresPool({
    databaseUrl: config.databaseUrl,
    ssl: config.databaseSsl,
  });

  try {
    await ensureMigrationTable(pool);
    const applied = await getAppliedMigrations(pool);

    const fileNames = (await readdir(migrationDir))
      .filter((entry) => entry.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const fileName of fileNames) {
      if (applied.has(fileName)) {
        continue;
      }

      const fullPath = path.join(migrationDir, fileName);
      const sql = await readFile(fullPath, "utf-8");

      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query(sql);
        await client.query(
          "insert into schema_migrations(name) values ($1)",
          [fileName],
        );
        await client.query("commit");
        console.log(`[db:migrate] Applied ${fileName}`);
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    }

    console.log("[db:migrate] Complete.");
  } finally {
    await pool.end();
  }
}

void run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[db:migrate] Failed: ${message}`);
  process.exitCode = 1;
});
