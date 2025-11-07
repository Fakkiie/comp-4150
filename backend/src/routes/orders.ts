import { Router } from "express";
import { q } from "../db";

const r = Router();

// get all order items with product details
r.get("/items", async (_req, res) => {
  const sql = `
    SELECT o.orderid, p.name AS productname, oi.quantity, oi.unitpriceatorder
    FROM "Order" o
    JOIN orderitem oi ON o.orderid = oi.orderid
    JOIN product p ON oi.productid = p.productid
    ORDER BY o.orderid
  `;
  try {
    const { rows } = await q(sql);
    res.json(rows);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

// create order from cart
r.post("/checkout", async (req, res) => {
  const { customerid, shippingaddress } = req.body;
  try {
    const { rows } = await q(`SELECT createorderfromcart($1, $2) AS orderid`, [
      customerid,
      shippingaddress,
    ]);
    res.json({ orderid: rows[0]?.orderid });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

// cancel an order
r.post("/:orderid/cancel", async (req, res) => {
  const orderid = Number(req.params.orderid);
  try {
    const { rows } = await q(`SELECT cancelorder($1) AS result`, [orderid]);
    res.json({ message: rows[0]?.result });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || String(err) });
  }
});

export default r;
