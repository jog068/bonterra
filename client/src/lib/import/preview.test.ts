import { describe, expect, it } from 'vitest';
import { buildPreview, selectedTransactions, selectionSummary, toggleRow } from './preview';

const EXISTING = [{ date: '2026-08-21', amountCents: 8875, description: 'Groceries' }];

// Row 0 valid, row 1 duplicates EXISTING, row 2 invalid date, row 3 valid.
const MESSY_CSV =
  'Posted Date,Memo,Amount\n' +
  '08/03/2026,"WHOLE FOODS, SF",-$54.20\n' +
  '08/21/2026,Groceries,-88.75\n' +
  'not-a-date,Mystery charge,-10.00\n' +
  '08/15/2026,Refund,45.00\n';

function messyPreview() {
  const result = buildPreview(MESSY_CSV, EXISTING);
  if (!result.ok) throw new Error('expected ok');
  return result.preview;
}

describe('buildPreview', () => {
  it('selects valid rows by default, excludes duplicates and invalid rows', () => {
    const preview = messyPreview();
    expect(preview.rows).toHaveLength(4);
    expect([...preview.selected].sort()).toEqual([0, 3]);
  });

  it('defaults a within-batch repeat to unselected even with no database match', () => {
    const csv = 'date,description,amount\n2026-08-01,Twice,4.50\n2026-08-01,Twice,4.50\n';
    const result = buildPreview(csv, []);
    if (!result.ok) throw new Error('expected ok');
    expect([...result.preview.selected]).toEqual([0]);
  });

  it('passes a parse failure through', () => {
    const result = buildPreview('Foo,Bar\n1,2\n', []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/date/i);
  });
});

describe('toggleRow', () => {
  it('opts a defaulted-out duplicate in, returning a new value', () => {
    const preview = messyPreview();
    const next = toggleRow(preview, 1, true);
    expect(next).not.toBe(preview);
    expect(next.selected.has(1)).toBe(true);
    expect(preview.selected.has(1)).toBe(false); // input untouched
  });

  it('opts a selected row out', () => {
    const preview = messyPreview();
    expect(toggleRow(preview, 0, false).selected.has(0)).toBe(false);
  });

  it('is a no-op on an invalid row', () => {
    const preview = messyPreview();
    expect(toggleRow(preview, 2, true)).toBe(preview);
  });
});

describe('selectionSummary', () => {
  it('reports the N-of-M and invalid counts', () => {
    expect(selectionSummary(messyPreview())).toEqual({
      selectedCount: 2,
      totalRows: 4,
      invalidCount: 1,
    });
  });

  it('tracks toggles', () => {
    const next = toggleRow(messyPreview(), 1, true);
    expect(selectionSummary(next).selectedCount).toBe(3);
  });
});

describe('selectedTransactions', () => {
  it('returns exactly the selected valid transactions in row order', () => {
    const transactions = selectedTransactions(messyPreview());
    expect(transactions.map((t) => t.description)).toEqual(['WHOLE FOODS, SF', 'Refund']);
    expect(transactions[0]).toMatchObject({ amountCents: 5420, type: 'expense' });
  });
});
