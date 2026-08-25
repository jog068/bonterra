import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { createTransactionSchema } from '@budget/shared';
import type { Db } from '../db';
import { transactions } from '../db/schema';
import { HttpError } from '../errors';

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

  // Full replacement: the body is the same contract as create.
  router.put('/:id', (req, res) => {
    const data = createTransactionSchema.parse(req.body);
    const [row] = db
      .update(transactions)
      .set(data)
      .where(eq(transactions.id, req.params.id))
      .returning()
      .all();
    if (!row) throw new HttpError(404, 'Transaction not found');
    res.json(row);
  });

  router.delete('/:id', (req, res) => {
    const result = db.delete(transactions).where(eq(transactions.id, req.params.id)).run();
    if (result.changes === 0) throw new HttpError(404, 'Transaction not found');
    res.status(204).end();
  });

  return router;
}
