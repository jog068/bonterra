import { describe, expect, it } from 'vitest';
import { parseCsv } from './parse';

describe('parseCsv', () => {
  it('parses a messy bank export with quoted commas and synonym headers', () => {
    const csv =
      'Posted Date,Memo,Amount\n' +
      '08/21/2026,"AMAZON, INC",-$23.45\n' +
      '08/22/2026,Payroll,"$1,000.00"\n';
    const result = parseCsv(csv);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({
        index: 0,
        status: 'valid',
        transaction: {
          date: '2026-08-21',
          description: 'AMAZON, INC',
          amountCents: 2345,
          type: 'expense',
          category: 'Other',
        },
      });
      expect(result.rows[1].status).toBe('valid');
    }
  });

  it('keeps invalid rows with their reasons alongside valid ones', () => {
    const csv = 'date,description,amount\n2026-08-21,Coffee,4.50\nsomeday,Tea,2.00\n';
    const result = parseCsv(csv);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows.map((r) => r.status)).toEqual(['valid', 'invalid']);
    }
  });

  it('reports missing required columns', () => {
    const result = parseCsv('Foo,Bar\n1,2\n');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/date/i);
  });

  it('ignores trailing empty lines', () => {
    const result = parseCsv('date,description,amount\n2026-08-21,Coffee,4.50\n\n\n');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toHaveLength(1);
  });
});
