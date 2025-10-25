import 'dotenv/config';
import { Client } from 'pg';

(async () => {
  const raw = process.env.DATABASE_URL ?? '';
  const shown = raw.replace(/:(.+?)@/, ':*****@');
  console.log('DATABASE_URL =', shown);

  const client = new Client({
    connectionString: raw,
    // DEV: skip cert verification only for this connection (no global override)
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const r = await client.query('select now() as now');
    console.log('DB OK:', r.rows[0].now);
  } catch (e) {
    console.error('DB ERROR:', e);
  } finally {
    await client.end();
  }
})();
