import { Router } from "express";
import { q } from "../db";

const r = Router();

// SIGNUP — always non-admin
r.post("/signup", async (req, res) => {
  const { email, fullName, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const { rows } = await q(
      `INSERT INTO customer (email, fullname, passwordhash, isadmin)
       VALUES ($1, $2, $3, FALSE)
       RETURNING customerid, email, fullname, isadmin`,
      [email, fullName || null, password]
    );

    const user = rows[0];
    res.json({ ok: true, user });
  } catch (err: any) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already in use" });
    }
    res.status(500).json({ error: err.message || String(err) });
  }
});

// LOGIN — returns isAdmin
r.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const { rows } = await q(
      `SELECT customerid, email, fullname, passwordhash, isadmin
       FROM customer
       WHERE email = $1`,[email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    if (user.passwordhash !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    delete user.passwordhash;
    res.json({
      ok: true,
      user: {
        customerid: user.customerid,
        email: user.email,
        fullName: user.fullname,
        isAdmin: user.isadmin
      }
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default r;
