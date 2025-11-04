import { Router } from 'express';
import { q } from '../db';

const r = Router();
r.get('/', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
r.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

r.get('/ping', (_req, res) => res.json({ ok: true }));

r.get('/db', async (_req, res, next) => {
  try {
    const rs = await q('select now() as now');
    res.json({ db: 'ok', now: rs.rows[0].now });
  } catch (e) { next(e); }
});

export default r;
