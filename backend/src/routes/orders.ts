import { Router } from 'express';
import { q } from '../db'; 

const router = Router();

/**
 * @route   POST /api/orders/checkout
 * @desc    Creates a new order from the user's cart
 * Simulates payment success or failure
 */
router.post('/checkout', async (req, res) => {
  try {
    const { customerID, shippingAddress } = req.body;

    if (!customerID || !shippingAddress) {
      return res.status(400).json({ error: 'Missing customerID or shippingAddress' });
    }

    // 2. Call CreateOrderFromCart function
    const createOrderSql = 'SELECT CreateOrderFromCart($1, $2) AS newOrderID';
    const { rows } = await q(createOrderSql, [customerID, shippingAddress]);

    const newOrderID = rows[0].neworderid;

    // 3. Run  "Mock Validation"
    // 80% success rate, 20% failure rate
    // In place of a paypal API
    const isPaymentSuccessful = Math.random() > 0.2; 

    if (isPaymentSuccessful) {
      // 4a. Call  HandlePaymentSuccess function
      await q('SELECT HandlePaymentSuccess($1)', [newOrderID]);
      
      return res.status(200).json({ success: true, orderID: newOrderID });

    } else {
      // 4b. Call  HandlePaymentFailure function
      await q('SELECT HandlePaymentFailure($1)', [newOrderID]);

      return res.status(400).json({ success: false, error: 'Mock Payment Failed' });
    }

  } catch (err: any) {
    // 5. Handle all errors (incl. "Out of Stock")
    // If the database RAISE EXCEPTION (like "Out of Stock"),
    // it will be caught here. The error message will be in err.message.
    console.error(err.message);
    return res.status(400).json({ error: err.message });
  }
});

/**
 * @route   POST /api/orders/cancel
 * @desc    Cancels an order if it is 'Pending' or 'Processing'
 */
router.post('/cancel', async (req, res) => {
  try {
    const { orderID } = req.body;

    if (!orderID) {
      return res.status(400).json({ error: 'Missing orderID' });
    }

    // 1. Call CancelOrder function
    const sql = 'SELECT CancelOrder($1) AS status_message';
    const { rows } = await q(sql, [orderID]);

    const statusMessage = rows[0].status_message;

    // 2. Check the text response from the database function
    if (statusMessage.startsWith('Error:')) {
      // This is a business logic error (e.g., "Order already shipped")
      return res.status(400).json({ success: false, error: statusMessage });
    }

    // 3. Send the success response
    return res.status(200).json({ success: true, message: statusMessage });

  } catch (err: any) {
    console.error(err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;