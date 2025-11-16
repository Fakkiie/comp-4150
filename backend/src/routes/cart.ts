import { Router } from "express";
import { q } from "../db";

const r = Router();

// Helper function to update the main Cart's total price
// We call this after every add/remove operation
const updateCartTotal = async (cartId: number) => {
  await q(
    `UPDATE cart 
     SET total = (
       SELECT COALESCE(SUM(ci.quantity * p.unitprice), 0)
       FROM cartitem ci
       JOIN product p ON ci.productid = p.productid
       WHERE ci.cartid = $1
     )
     WHERE cartid = $1`,
    [cartId]
  );
};

// GET COUNT
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

// GET CART ITEMS
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

// ADD TO CART
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

    // Update or Insert Item
    const checkItem = await q(
      `SELECT * FROM cartitem WHERE cartid = $1 AND productid = $2`,
      [cartId, productId]
    );

    if (checkItem.rows.length > 0) {
      await q(
        `UPDATE cartitem SET quantity = quantity + $1 WHERE cartid = $2 AND productid = $3`,
        [quantity || 1, cartId, productId]
      );
    } else {
      await q(
        `INSERT INTO cartitem (cartid, productid, quantity) VALUES ($1, $2, $3)`,
        [cartId, productId, quantity || 1]
      );
    }

    // Recalculate Total Cost
    await updateCartTotal(cartId);

    res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// REMOVE ITEM 
r.delete("/:customerId/item/:productId", async (req, res) => {
    const { customerId, productId } = req.params;
  
    try {
      const cartRes = await q(
        `SELECT cartid FROM cart WHERE customerid = $1 AND status = 'Active' LIMIT 1`,
        [customerId]
      );
  
      if (cartRes.rows.length > 0) {
        const cartId = cartRes.rows[0].cartid;
        
        // Remove item
        await q(
          `DELETE FROM cartitem WHERE cartid = $1 AND productid = $2`,
          [cartId, productId]
        );

        // Recalculate Total Cost
        await updateCartTotal(cartId);
      }
      
      res.json({ ok: true });
    } catch (err: any) {
      console.error("Error removing item:", err);
      res.status(500).json({ error: err.message });
    }
  });

export default r;