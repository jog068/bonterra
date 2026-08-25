import { describe, expect, it } from 'vitest';
import { dupKey, markDuplicates } from './duplicates';
import type { ImportRow } from './normalize';

const existing = [
  { date: '2026-08-21', amountCents: 8875, description: 'Groceries' },
  { date: '2026-08-01', amountCents: 320000, description: 'Paycheck' },
];

function validRow(index: number, overrides: Partial<{ date: string; amountCents: number; description: string }> = {}): ImportRow {
  return {
    index,
    status: 'valid',
    transaction: {
      date: '2026-08-21',
      description: 'Groceries',
      amountCents: 8875,
      type: 'expense',
      category: 'Food',
      ...overrides,
    },
  };
}

describe('dupKey', () => {
  it('ignores case and extra whitespace in the description', () => {
    expect(dupKey({ date: '2026-08-21', amountCents: 8875, description: '  Grocery   RUN ' })).toBe(
      dupKey({ date: '2026-08-21', amountCents: 8875, description: 'grocery run' }),
    );
  });

  it('distinguishes different dates and amounts', () => {
    const base = { date: '2026-08-21', amountCents: 8875, description: 'Groceries' };
    expect(dupKey(base)).not.toBe(dupKey({ ...base, date: '2026-08-22' }));
    expect(dupKey(base)).not.toBe(dupKey({ ...base, amountCents: 8876 }));
  });
});

describe('markDuplicates', () => {
  it('flags rows that match an existing transaction on date + amount + description', () => {
    const rows = markDuplicates([validRow(0)], existing);
    expect(rows[0]).toMatchObject({ status: 'valid', duplicate: true });
  });

  it('leaves non-matching rows unflagged', () => {
    const rows = markDuplicates([validRow(0, { description: 'Something new' })], existing);
    expect(rows[0]).toMatchObject({ status: 'valid', duplicate: false });
  });

  it('flags a repeat within the same batch even when the database has no match', () => {
    const rows = markDuplicates(
      [validRow(0, { description: 'Twice pasted' }), validRow(1, { description: 'Twice pasted' })],
      [],
    );
    expect(rows.map((r) => (r.status === 'valid' ? r.duplicate : null))).toEqual([false, true]);
  });

  it('passes invalid rows through untouched', () => {
    const invalid: ImportRow = { index: 0, status: 'invalid', errors: ['bad'] };
    expect(markDuplicates([invalid], existing)[0]).toEqual(invalid);
  });
});
