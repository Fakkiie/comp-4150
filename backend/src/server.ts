import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import health from './routes/health';
import orderRoutes from './routes/orders';

const app = express();

// CORS first
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true, 
}));

app.use(express.json());

// your routes
app.use('/api/health', health);
app.use('/api/orders', orderRoutes); 

// minimal error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: String(err?.message || err) });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
