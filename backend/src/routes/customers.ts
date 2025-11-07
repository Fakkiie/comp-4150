import { Router } from "express";
import { q } from "../db";

const r = Router();

// get all customers
r.get("/", async (_req, res) => {
  try {
    const { rows } = await q("SELECT * FROM customer ORDER BY customerid");
    res.json(rows);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

// find customer by email
r.get("/by-email", async (req, res) => {
  const email = req.query.email;
  try {
    const { rows } = await q("SELECT * FROM customer WHERE email = $1", [email]);
    res.json(rows);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

// update customer name
r.put("/:id/name", async (req, res) => {
  const id = Number(req.params.id);
  const { fullname } = req.body;
  try {
    const { rows } = await q(
      "UPDATE customer SET fullname = $1 WHERE customerid = $2 RETURNING *",
      [fullname, id]
    );
    res.json(rows[0]);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

// update customer password
r.put("/:id/password", async (req, res) => {
  const id = Number(req.params.id);
  const { passwordhash } = req.body;
  try {
    await q("UPDATE customer SET passwordhash = $1 WHERE customerid = $2", [passwordhash, id]);
    res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

// update customer email
r.put("/:id/email", async (req, res) => {
  const id = Number(req.params.id);
  const { email } = req.body;
  try {
    await q("SELECT updatecustomeremail($1, $2)", [id, email]);
    res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

export default r;
