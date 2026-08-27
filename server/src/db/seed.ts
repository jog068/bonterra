import { count } from 'drizzle-orm';
import type { Db } from './index';
import { transactions } from './schema';

type SeedRow = typeof transactions.$inferInsert;

const SEED_ROWS: SeedRow[] = [
  { date: '2026-06-01', description: 'Paycheck', amountCents: 320000, type: 'income', category: 'Salary' },
  { date: '2026-06-01', description: 'Rent', amountCents: 140000, type: 'expense', category: 'Rent' },
  { date: '2026-06-03', description: 'Groceries', amountCents: 8425, type: 'expense', category: 'Food' },
  { date: '2026-06-07', description: 'Electric bill', amountCents: 9210, type: 'expense', category: 'Utilities' },
  { date: '2026-06-10', description: 'Groceries', amountCents: 10160, type: 'expense', category: 'Food' },
  { date: '2026-06-12', description: 'Gas', amountCents: 4890, type: 'expense', category: 'Transport' },
  { date: '2026-06-15', description: 'Paycheck', amountCents: 320000, type: 'income', category: 'Salary' },
  { date: '2026-06-18', description: 'Streaming subscription', amountCents: 1599, type: 'expense', category: 'Entertainment' },
  { date: '2026-06-21', description: 'Pharmacy', amountCents: 2350, type: 'expense', category: 'Health' },
  { date: '2026-06-24', description: 'Groceries', amountCents: 9375, type: 'expense', category: 'Food' },
  { date: '2026-06-28', description: 'Dinner out', amountCents: 6240, type: 'expense', category: 'Food' },
  { date: '2026-07-01', description: 'Paycheck', amountCents: 320000, type: 'income', category: 'Salary' },
  { date: '2026-07-01', description: 'Rent', amountCents: 140000, type: 'expense', category: 'Rent' },
  { date: '2026-07-02', description: 'Internet bill', amountCents: 6000, type: 'expense', category: 'Utilities' },
  { date: '2026-07-05', description: 'Groceries', amountCents: 8890, type: 'expense', category: 'Food' },
  { date: '2026-07-08', description: 'Metro card', amountCents: 12700, type: 'expense', category: 'Transport' },
  { date: '2026-07-12', description: 'Concert tickets', amountCents: 8500, type: 'expense', category: 'Entertainment' },
  { date: '2026-07-15', description: 'Paycheck', amountCents: 320000, type: 'income', category: 'Salary' },
  { date: '2026-07-19', description: 'Groceries', amountCents: 11020, type: 'expense', category: 'Food' },
  { date: '2026-07-22', description: 'Gym membership', amountCents: 4500, type: 'expense', category: 'Health' },
  { date: '2026-07-27', description: 'Groceries', amountCents: 7660, type: 'expense', category: 'Food' },
  { date: '2026-08-01', description: 'Paycheck', amountCents: 320000, type: 'income', category: 'Salary' },
  { date: '2026-08-01', description: 'Rent', amountCents: 140000, type: 'expense', category: 'Rent' },
  { date: '2026-08-04', description: 'Electric bill', amountCents: 10480, type: 'expense', category: 'Utilities' },
  { date: '2026-08-07', description: 'Groceries', amountCents: 9540, type: 'expense', category: 'Food' },
  { date: '2026-08-11', description: 'Gas', amountCents: 5230, type: 'expense', category: 'Transport' },
  { date: '2026-08-15', description: 'Paycheck', amountCents: 320000, type: 'income', category: 'Salary' },
  { date: '2026-08-16', description: 'Freelance payment', amountCents: 45000, type: 'income', category: 'Other' },
  { date: '2026-08-18', description: 'Movie night', amountCents: 3200, type: 'expense', category: 'Entertainment' },
  { date: '2026-08-21', description: 'Groceries', amountCents: 8875, type: 'expense', category: 'Food' },
];

export function seedIfEmpty(db: Db) {
  const [{ value }] = db.select({ value: count() }).from(transactions).all();
  if (value > 0) return;
  db.insert(transactions).values(SEED_ROWS).run();
}
