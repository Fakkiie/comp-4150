import { Router } from "express";
import { q } from "../db";

const r = Router();

/* ========= GET ALL PRODUCTS ========= */
r.get("/", async (_req, res) => {
  try {
    const { rows } = await q(
      `SELECT 
         productid AS id,
         name,
         unitprice AS price,
         stockqty AS stock
       FROM product
       ORDER BY productid`
    );
    res.json(rows);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to load products" });
  }
});

/* ========= CREATE PRODUCT ========= */
r.post("/", async (req, res) => {
  const { name, price, stock } = req.body;

  if (!name || price == null || stock == null) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const { rows } = await q(
      `INSERT INTO product (name, unitprice, stockqty)
       VALUES ($1, $2, $3)
       RETURNING productid AS id, name, unitprice AS price, stockqty AS stock`,
      [name, price, stock]
    );
    res.json(rows[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

/* ========= UPDATE PRODUCT ========= */
r.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, price } = req.body;

  try {
    const { rows } = await q(
      `UPDATE product
       SET name = $1, unitprice = $2
       WHERE productid = $3
       RETURNING productid AS id, name, unitprice AS price, stockqty AS stock`,
      [name, price, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(rows[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

/* ========= DELETE PRODUCT ========= */
r.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const { rowCount } = await q(
      `DELETE FROM product WHERE productid = $1`,
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default r;
