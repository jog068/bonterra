import { Router } from 'express';
import { transactionFiltersSchema } from '@budget/shared';
import type { Db } from '../db';
import { summarizeTransactions } from '../db/queries';

export function summaryRouter(db: Db) {
  const router = Router();
  router.get('/', (req, res) => {
    const filters = transactionFiltersSchema.parse(req.query);
    res.json(summarizeTransactions(db, filters));
  });

  return router;
}
