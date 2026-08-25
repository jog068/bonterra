import type { CreateTransaction } from '@budget/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type Db } from './index';
import { insertTransactions, listTransactions, summarizeTransactions } from './queries';
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

describe('summarizeTransactions', () => {
  it('totals income, expenses, and net across all transactions', () => {
    expect(summarizeTransactions(db, {})).toEqual({
      totalIncomeCents: 320000,
      totalExpenseCents: 25500,
      netCents: 294500,
    });
  });

  it('respects the same filters as the list', () => {
    expect(summarizeTransactions(db, { category: 'Food' })).toEqual({
      totalIncomeCents: 0,
      totalExpenseCents: 14500,
      netCents: -14500,
    });
  });

  it('returns zeros for an empty result set', () => {
    expect(summarizeTransactions(db, { search: 'no such thing' })).toEqual({
      totalIncomeCents: 0,
      totalExpenseCents: 0,
      netCents: 0,
    });
  });

  it('sums cent values exactly where dollar floats would drift', () => {
    // 0.1 + 0.2 !== 0.3 in floating point; 10¢ + 20¢ === 30¢ in integers.
    db.delete(transactions).run();
    db.insert(transactions)
      .values([
        { date: '2026-01-01', description: 'Dime', amountCents: 10, type: 'expense', category: 'Other' },
        { date: '2026-01-02', description: 'Two dimes', amountCents: 20, type: 'expense', category: 'Other' },
      ])
      .run();
    expect(summarizeTransactions(db, {}).totalExpenseCents).toBe(30);
  });
});

describe('insertTransactions', () => {
  const newRows: CreateTransaction[] = [
    { date: '2026-08-20', description: 'Book', amountCents: 1500, type: 'expense', category: 'Other' },
    { date: '2026-08-21', description: 'Refund', amountCents: 900, type: 'income', category: 'Other' },
  ];

  it('inserts every row and reports the count', () => {
    expect(insertTransactions(db, newRows)).toBe(2);
    expect(listTransactions(db, {})).toHaveLength(FIXTURES.length + 2);
  });

  it('leaves the database unchanged when any row fails', () => {
    const poisoned = [
      ...newRows,
      { ...newRows[0], description: null } as unknown as CreateTransaction,
    ];
    expect(() => insertTransactions(db, poisoned)).toThrow();
    expect(listTransactions(db, {})).toHaveLength(FIXTURES.length);
  });
});
