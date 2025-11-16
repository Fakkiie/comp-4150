import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import health from './routes/health';
import products from './routes/products';
import orders from './routes/orders';
import payments from './routes/payments';
import customers from './routes/customers';
import auth from './routes/auth';
import cartRoutes from './routes/cart';
const app = express();

// allow requests from frontend
// if we host this separately, update the origin accordingly
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());

// mount all the route handlers
app.use('/api/health', health);
app.use('/api/products', products);
app.use('/api/orders', orders);
app.use('/api/payments', payments);
app.use('/api/customers', customers);
app.use('/api/auth', auth);
app.use('/api/cart', cartRoutes);


// catch any errors
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err?.message || String(err) });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
