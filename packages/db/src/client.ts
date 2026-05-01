import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

let pool: pg.Pool | null = null;

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required');

    pool = new pg.Pool({
      connectionString: url,
    });
  }

  return pool;
}

export const db = drizzle(getPool());

export const closeDb = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};