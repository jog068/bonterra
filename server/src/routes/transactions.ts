import { Router } from 'express';
import { desc } from 'drizzle-orm';
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

  return router;
}
