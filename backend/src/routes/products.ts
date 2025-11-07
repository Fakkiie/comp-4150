import { Router } from "express";
import { q } from "../db";

const r = Router();

// search products by name
r.get("/search", async (req, res) => {
  const term = String(req.query.term || "");
  try {
    const { rows } = await q("SELECT * FROM product WHERE name ILIKE $1", [`%${term}%`]);
    res.json(rows);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

// get products within price range
r.get("/price-range", async (req, res) => {
  const min = Number(req.query.min || 0);
  const max = Number(req.query.max || 999999);
  try {
    const { rows } = await q("SELECT * FROM product WHERE unitprice BETWEEN $1 AND $2", [min, max]);
    res.json(rows);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

// get products that are in stock
r.get("/in-stock", async (_req, res) => {
  try {
    const { rows } = await q("SELECT * FROM product WHERE stockqty > 0 ORDER BY name");
    res.json(rows);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

// get products with low stock
r.get("/low-stock", async (req, res) => {
  const threshold = Number(req.query.threshold || 20);
  try {
    const { rows } = await q("SELECT * FROM product WHERE stockqty < $1", [threshold]);
    res.json(rows);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

// get total product count
r.get("/analytics/total", async (_req, res) => {
  try {
    const { rows } = await q("SELECT COUNT(*) AS totalproducts FROM product");
    res.json(rows[0]);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

// get average product price
r.get("/analytics/average-price", async (_req, res) => {
  try {
    const { rows } = await q("SELECT ROUND(AVG(unitprice), 2) AS averageprice FROM product");
    res.json(rows[0]);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

export default r;
