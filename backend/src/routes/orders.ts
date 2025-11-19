import { Router } from "express";
import { q } from "../db";

const r = Router();

// get all orders for a customer
r.get("/customer/:customerId", async (req, res) => {
  const { customerId } = req.params;

  try {
    const { rows } = await q(
      `
      SELECT 
        o.orderid,
        o.orderdate,
        o.status,
        o.totalamount,
        o.shippingaddress,
        json_agg(
          json_build_object(
            'productName', p.name,
            'quantity', oi.quantity,
            'unitPrice', oi.unitpriceatorder
          )
        ) AS items
      FROM "Order" o
      JOIN orderitem oi ON o.orderid = oi.orderid
      JOIN product p ON oi.productid = p.productid
      WHERE o.customerid = $1
      GROUP BY 
        o.orderid,
        o.orderdate,
        o.status,
        o.totalamount,
        o.shippingaddress
      ORDER BY o.orderdate DESC
      `,
      [customerId]
    );

    const orders = rows.map((row: any) => ({
      orderid: row.orderid,
      orderdate: row.orderdate,
      status: row.status,
      totalamount: row.totalamount,
      shippingaddress: row.shippingaddress,
      items: row.items ?? [],
    }));

    res.json(orders);
  } catch (err: any) {
    console.error("Error fetching customer orders:", err);
    res.status(500).json({ error: err.message });
  }
});

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
