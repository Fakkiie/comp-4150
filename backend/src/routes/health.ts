import { Router } from 'express';
import { q } from '../db';

const r = Router();

// simple ping
r.get('/ping', (_req, res) => res.json({ ok: true }));

// DB check
r.get('/db', async (_req, res, next) => {
  try {
    const rs = await q('select now() as now');
    res.json({ db: 'ok', now: rs.rows[0].now });
  } catch (e) { next(e); }
});

export default r;
