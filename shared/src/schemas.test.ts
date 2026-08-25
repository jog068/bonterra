import { describe, expect, it } from 'vitest';
import { createTransactionSchema } from './schemas';

const valid = {
  date: '2026-08-21',
  description: 'Groceries',
  amountCents: 8875,
  type: 'expense',
  category: 'Food',
};

describe('createTransactionSchema', () => {
  it('accepts a valid payload', () => {
    expect(createTransactionSchema.parse(valid)).toEqual(valid);
  });

  it('accepts a category outside the preset list', () => {
    const result = createTransactionSchema.safeParse({ ...valid, category: 'Pet supplies' });
    expect(result.success).toBe(true);
  });

  it.each([-100, 0, 12.5])('rejects amountCents of %p', (amountCents) => {
    expect(createTransactionSchema.safeParse({ ...valid, amountCents }).success).toBe(false);
  });

  it.each(['08/21/2026', '2026-8-21', '2026-13-01', '2026-02-30', 'yesterday'])(
    'rejects date %p',
    (date) => {
      expect(createTransactionSchema.safeParse({ ...valid, date }).success).toBe(false);
    },
  );

  it('accepts Feb 29 in a leap year', () => {
    expect(createTransactionSchema.safeParse({ ...valid, date: '2028-02-29' }).success).toBe(true);
  });

  it.each(['', '   '])('rejects blank description %p', (description) => {
    expect(createTransactionSchema.safeParse({ ...valid, description }).success).toBe(false);
  });

  it('rejects an unknown type', () => {
    expect(createTransactionSchema.safeParse({ ...valid, type: 'transfer' }).success).toBe(false);
  });

  it('rejects a missing category', () => {
    const { category, ...rest } = valid;
    expect(createTransactionSchema.safeParse(rest).success).toBe(false);
  });
});
