import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './index';
import { listTransactions } from './queries';
import { transactions } from './schema';

let db: Db;

const FIXTURES = [
  { date: '2026-08-01', description: 'Paycheck', amountCents: 320000, type: 'income', category: 'Salary' },
  { date: '2026-08-05', description: 'Groceries', amountCents: 8000, type: 'expense', category: 'Food' },
  { date: '2026-08-10', description: 'Electric bill', amountCents: 9000, type: 'expense', category: 'Utilities' },
  { date: '2026-08-12', description: '50% off sale', amountCents: 2000, type: 'expense', category: 'Other' },
  { date: '2026-08-15', description: 'Grocery run', amountCents: 6500, type: 'expense', category: 'Food' },
] as const;

beforeEach(() => {
  db = createDb(':memory:');
  db.insert(transactions).values([...FIXTURES]).run();
});

describe('listTransactions', () => {
  it('returns everything ordered by date descending when unfiltered', () => {
    const rows = listTransactions(db, {});
    expect(rows.map((r) => r.date)).toEqual([
      '2026-08-15',
      '2026-08-12',
      '2026-08-10',
      '2026-08-05',
      '2026-08-01',
    ]);
  });

  it('filters by type', () => {
    const rows = listTransactions(db, { type: 'income' });
    expect(rows.map((r) => r.description)).toEqual(['Paycheck']);
  });

  it('filters by category', () => {
    const rows = listTransactions(db, { category: 'Food' });
    expect(rows.map((r) => r.description)).toEqual(['Grocery run', 'Groceries']);
  });

  it('search matches description case-insensitively', () => {
    const rows = listTransactions(db, { search: 'gro' });
    expect(rows.map((r) => r.description)).toEqual(['Grocery run', 'Groceries']);
  });

  it('search treats % and _ literally', () => {
    const rows = listTransactions(db, { search: '50%' });
    expect(rows.map((r) => r.description)).toEqual(['50% off sale']);
  });

  it('combines filters with AND', () => {
    const rows = listTransactions(db, { type: 'expense', category: 'Food', search: 'grocery' });
    expect(rows.map((r) => r.description)).toEqual(['Grocery run']);
  });
});
