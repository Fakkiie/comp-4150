import 'dotenv/config';
import express from 'express';
import health from './routes/health';

const app = express();
app.use(express.json());
app.use('/health', health);

// minimal error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: String(err?.message || err) });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
