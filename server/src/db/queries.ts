import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import type { Summary, TransactionFilters } from '@budget/shared';
import type { Db } from './index';
import { transactions } from './schema';

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/** Shared WHERE clause for the list and summary endpoints. */
export function transactionFilterClause(filters: TransactionFilters): SQL | undefined {
  const conditions: SQL[] = [];
  if (filters.type) conditions.push(eq(transactions.type, filters.type));
  if (filters.category) conditions.push(eq(transactions.category, filters.category));
  if (filters.search) {
    const pattern = `%${escapeLike(filters.search)}%`;
    conditions.push(sql`${transactions.description} LIKE ${pattern} ESCAPE '\\'`);
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export function listTransactions(db: Db, filters: TransactionFilters) {
  return db
    .select()
    .from(transactions)
    .where(transactionFilterClause(filters))
    .orderBy(desc(transactions.date), desc(transactions.id))
    .all();
}

export function summarizeTransactions(db: Db, filters: TransactionFilters): Summary {
  const rows = db
    .select({
      type: transactions.type,
      total: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)`,
    })
    .from(transactions)
    .where(transactionFilterClause(filters))
    .groupBy(transactions.type)
    .all();

  const totalIncomeCents = rows.find((r) => r.type === 'income')?.total ?? 0;
  const totalExpenseCents = rows.find((r) => r.type === 'expense')?.total ?? 0;
  return { totalIncomeCents, totalExpenseCents, netCents: totalIncomeCents - totalExpenseCents };
}
