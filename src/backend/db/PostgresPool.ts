import { Pool } from "pg";

export interface PostgresPoolOptions {
  databaseUrl: string;
  ssl: boolean;
}

let singletonPool: Pool | null = null;

export function createPostgresPool(options: PostgresPoolOptions): Pool {
  return new Pool({
    connectionString: options.databaseUrl,
    ssl: options.ssl ? { rejectUnauthorized: false } : false,
    max: 12,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export function getSingletonPostgresPool(options: PostgresPoolOptions): Pool {
  if (singletonPool) {
    return singletonPool;
  }
  singletonPool = createPostgresPool(options);
  return singletonPool;
}

export async function checkPostgresHealth(pool: Pool): Promise<boolean> {
  try {
    const result = await pool.query<{ ok: number }>("select 1 as ok");
    return result.rowCount === 1;
  } catch {
    return false;
  }
}
