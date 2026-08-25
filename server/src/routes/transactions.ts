import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTransactionSchema, transactionFiltersSchema } from '@budget/shared';
import type { Db } from '../db';
import { insertTransactions, listTransactions } from '../db/queries';
import { transactions } from '../db/schema';
import { HttpError } from '../errors';

const importRequestSchema = z.object({
  transactions: z.array(createTransactionSchema).min(1).max(1000),
});

export function transactionsRouter(db: Db) {
  const router = Router();

  router.get('/', (req, res) => {
    const filters = transactionFiltersSchema.parse(req.query);
    res.json(listTransactions(db, filters));
  });

  router.post('/', (req, res) => {
    const data = createTransactionSchema.parse(req.body);
    const [row] = db.insert(transactions).values(data).returning().all();
    res.status(201).json(row);
  });

  // The client validates rows at preview time, so a 400 here is
  // defense-in-depth; errors come back indexed by row for debuggability.
  router.post('/import', (req, res) => {
    const parsed = importRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const rows = parsed.error.issues.map((issue) =>
        issue.path.length >= 3
          ? `Row ${Number(issue.path[1]) + 1}, ${String(issue.path[2])}: ${issue.message}`
          : issue.message,
      );
      res.status(400).json({ error: { message: 'Validation failed', fieldErrors: { rows } } });
      return;
    }
    const inserted = insertTransactions(db, parsed.data.transactions);
    res.status(201).json({ inserted });
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
