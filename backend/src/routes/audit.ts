import { Router } from "express";
import { q } from "../db";

const r = Router();

// Fetches the last 100 audit logs ordered by newest first
r.get("/", async (_req, res) => {
  try {
    const { rows } = await q(
      `SELECT logid, actiondesc, entitytype, entityid, timestamp 
       FROM auditlog 
       ORDER BY timestamp DESC 
       LIMIT 100`
    );
    res.json(rows);
  } catch (err: any) {
    console.error("Error fetching audit logs:", err);
    res.status(500).json({ error: err.message });
  }
});

export default r;