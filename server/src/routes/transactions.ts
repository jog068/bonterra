import { Router } from 'express';
import { desc } from 'drizzle-orm';
import { createTransactionSchema } from '@budget/shared';
import type { Db } from '../db';
import { transactions } from '../db/schema';

export function transactionsRouter(db: Db) {
  const router = Router();

  router.get('/', (_req, res) => {
    const rows = db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.date), desc(transactions.id))
      .all();
    res.json(rows);
  });

  router.post('/', (req, res) => {
    const data = createTransactionSchema.parse(req.body);
    const [row] = db.insert(transactions).values(data).returning().all();
    res.status(201).json(row);
  });

  return router;
}
