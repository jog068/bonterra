import { describe, expect, it } from 'vitest';
import { buildImportRow, normalizeAmount, normalizeDate, normalizeHeader, normalizeType } from './normalize';

describe('normalizeHeader', () => {
  it.each([
    ['Date', 'date'],
    ['Posted Date', 'date'],
    ['\uFEFFTransaction Date', 'date'],
    [' MEMO ', 'description'],
    ['Description', 'description'],
    ['Details', 'description'],
    ['Amount', 'amount'],
    ['Type', 'type'],
    ['Category', 'category'],
  ])('maps %p to %p', (header, expected) => {
    expect(normalizeHeader(header)).toBe(expected);
  });

  it('returns null for unknown headers', () => {
    expect(normalizeHeader('Running Balance')).toBeNull();
  });
});

describe('normalizeAmount', () => {
  it.each([
    ['42.50', { cents: 4250, negative: false }],
    ['-42.50', { cents: 4250, negative: true }],
    ['(42.50)', { cents: 4250, negative: true }],
    ['$1,234.56', { cents: 123456, negative: false }],
    ['($1,234.56)', { cents: 123456, negative: true }],
    ['$ 12', { cents: 1200, negative: false }],
    ['0.07', { cents: 7, negative: false }],
  ])('parses %p', (raw, expected) => {
    expect(normalizeAmount(raw)).toEqual(expected);
  });

  it.each(['', 'abc', '1.2.3', '--5', '()'])('rejects %p', (raw) => {
    expect(normalizeAmount(raw)).toBeNull();
  });
});

describe('normalizeDate', () => {
  it.each([
    ['2026-08-21', '2026-08-21'],
    ['08/21/2026', '2026-08-21'],
    ['8/1/2026', '2026-08-01'],
  ])('parses %p as %p', (raw, expected) => {
    expect(normalizeDate(raw)).toBe(expected);
  });

  it.each(['21/08/2026', '2026-02-30', 'yesterday', '', '08-21-2026'])('rejects %p', (raw) => {
    expect(normalizeDate(raw)).toBeNull();
  });
});

describe('normalizeType', () => {
  it.each([
    ['Income', 'income'],
    ['EXPENSE', 'expense'],
    ['credit', 'income'],
    ['Debit', 'expense'],
  ])('maps %p to %p', (raw, expected) => {
    expect(normalizeType(raw)).toBe(expected);
  });

  it('returns null for unrecognized types', () => {
    expect(normalizeType('transfer')).toBeNull();
  });
});

describe('buildImportRow', () => {
  it('builds a valid transaction from a clean record', () => {
    const row = buildImportRow(
      { date: '2026-08-21', description: 'Groceries', amount: '88.75', type: 'expense', category: 'Food' },
      0,
    );
    expect(row).toEqual({
      index: 0,
      status: 'valid',
      transaction: {
        date: '2026-08-21',
        description: 'Groceries',
        amountCents: 8875,
        type: 'expense',
        category: 'Food',
      },
    });
  });

  it('infers expense from a negative amount when no type is given', () => {
    const row = buildImportRow({ date: '08/21/2026', description: 'Coffee', amount: '-$4.50' }, 1);
    expect(row.status).toBe('valid');
    if (row.status === 'valid') {
      expect(row.transaction.type).toBe('expense');
      expect(row.transaction.amountCents).toBe(450);
    }
  });

  it('infers income from a positive amount when no type is given', () => {
    const row = buildImportRow({ date: '2026-08-01', description: 'Refund', amount: '25.00' }, 2);
    expect(row.status).toBe('valid');
    if (row.status === 'valid') expect(row.transaction.type).toBe('income');
  });

  it('lets an explicit type override the amount sign', () => {
    const row = buildImportRow(
      { date: '2026-08-01', description: 'Paycheck', amount: '-3200.00', type: 'income' },
      3,
    );
    expect(row.status).toBe('valid');
    if (row.status === 'valid') {
      expect(row.transaction.type).toBe('income');
      expect(row.transaction.amountCents).toBe(320000);
    }
  });

  it('defaults a missing category to Other', () => {
    const row = buildImportRow({ date: '2026-08-01', description: 'Coffee', amount: '4.50' }, 4);
    expect(row.status).toBe('valid');
    if (row.status === 'valid') expect(row.transaction.category).toBe('Other');
  });

  it('flags an unparseable amount', () => {
    const row = buildImportRow({ date: '2026-08-01', description: 'Coffee', amount: 'lots' }, 5);
    expect(row.status).toBe('invalid');
    if (row.status === 'invalid') expect(row.errors.join(' ')).toMatch(/amount/i);
  });

  it('flags an unparseable date', () => {
    const row = buildImportRow({ date: 'someday', description: 'Coffee', amount: '4.50' }, 6);
    expect(row.status).toBe('invalid');
    if (row.status === 'invalid') expect(row.errors.join(' ')).toMatch(/date/i);
  });

  it('flags a blank description', () => {
    const row = buildImportRow({ date: '2026-08-01', description: '  ', amount: '4.50' }, 7);
    expect(row.status).toBe('invalid');
    if (row.status === 'invalid') expect(row.errors.join(' ')).toMatch(/description/i);
  });

  it('flags a zero amount with a clear reason', () => {
    const row = buildImportRow({ date: '2026-08-01', description: 'Freebie', amount: '$0.00' }, 9);
    expect(row.status).toBe('invalid');
    if (row.status === 'invalid') expect(row.errors.join(' ')).toMatch(/greater than zero/i);
  });

  it('flags an unrecognized explicit type', () => {
    const row = buildImportRow(
      { date: '2026-08-01', description: 'Wire', amount: '10.00', type: 'transfer' },
      8,
    );
    expect(row.status).toBe('invalid');
    if (row.status === 'invalid') expect(row.errors.join(' ')).toMatch(/type/i);
  });
});
