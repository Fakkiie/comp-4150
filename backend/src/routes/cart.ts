import { Router } from "express";
import { q } from "../db";

const r = Router();

// GET COUNT (For the Store page badge)
r.get("/count/:customerId", async (req, res) => {
  const { customerId } = req.params;
  try {
    const { rows } = await q(
      `SELECT SUM(ci.quantity) as count 
       FROM cart c
       JOIN cartitem ci ON c.cartid = ci.cartid
       WHERE c.customerid = $1`,
      [customerId]
    );
    res.json({ count: Number(rows[0]?.count) || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET CART ITEMS (For the Checkout page calculation)
r.get("/:customerId", async (req, res) => {
  const { customerId } = req.params;
  try {
    const { rows } = await q(
      `SELECT 
         ci.quantity, 
         p.productid, 
         p.name, 
         p.unitprice as price, 
         (ci.quantity * p.unitprice) as total_price
       FROM cart c
       JOIN cartitem ci ON c.cartid = ci.cartid
       JOIN product p ON ci.productid = p.productid
       WHERE c.customerid = $1`, 
      [customerId]
    );
    res.json(rows);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ADD TO CART (For the Store page button)
r.post("/add", async (req, res) => {
  const { customerId, productId, quantity } = req.body;

  try {
    // Find or Create Active Cart
    let cartId;
    const cartRes = await q(
      `SELECT cartid FROM cart WHERE customerid = $1 AND status = 'Active' LIMIT 1`, 
      [customerId]
    );

    if (cartRes.rows.length > 0) {
      cartId = cartRes.rows[0].cartid;
    } else {
      const newCart = await q(
        `INSERT INTO cart (customerid, status, total) VALUES ($1, 'Active', 0) RETURNING cartid`,
        [customerId]
      );
      cartId = newCart.rows[0].cartid;
    }

    // Check if item exists in cartitem table
    const checkItem = await q(
      `SELECT * FROM cartitem WHERE cartid = $1 AND productid = $2`,
      [cartId, productId]
    );

    if (checkItem.rows.length > 0) {
      // Update quantity if exists
      await q(
        `UPDATE cartitem SET quantity = quantity + $1 WHERE cartid = $2 AND productid = $3`,
        [quantity || 1, cartId, productId]
      );
    } else {
      // Insert new item if not
      await q(
        `INSERT INTO cartitem (cartid, productid, quantity) VALUES ($1, $2, $3)`,
        [cartId, productId, quantity || 1]
      );
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default r;