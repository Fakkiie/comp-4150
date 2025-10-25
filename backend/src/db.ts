import 'dotenv/config';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // DEV: per-connection relax; no process.env NODE_TLS hack
  ssl: { rejectUnauthorized: false },
});

export const q = (sql: string, params?: any[]) => pool.query(sql, params);
