import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, 
});

export const q = (sql: string, params?: any[]) => pool.query(sql, params);
