import express from 'express';
import type { Db } from './db';
import { errorHandler } from './errors';
import { summaryRouter } from './routes/summary';
import { transactionsRouter } from './routes/transactions';

export function createApp(db: Db) {
  const app = express();
  app.use(express.json());
  app.use('/api/transactions', transactionsRouter(db));
  app.use('/api/summary', summaryRouter(db));
  app.use(errorHandler);
  return app;
}
