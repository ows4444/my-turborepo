import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

let pool: pg.Pool | null = null;

function getPool(url: string) {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: url,
    });
  }

  return pool;
}

export const db = (url: string) => drizzle(getPool(url));

export const closeDb = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
