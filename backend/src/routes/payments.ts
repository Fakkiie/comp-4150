import { Router } from "express";
import { q } from "../db";

const r = Router();

// mark payment as successful
r.post("/:orderid/succeeded", async (req, res) => {
  const orderid = Number(req.params.orderid);
  try {
    await q("SELECT handlepaymentsuccess($1)", [orderid]);
    res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

// mark payment as failed
r.post("/:orderid/failed", async (req, res) => {
  const orderid = Number(req.params.orderid);
  try {
    await q("SELECT handlepaymentfailure($1)", [orderid]);
    res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

export default r;
