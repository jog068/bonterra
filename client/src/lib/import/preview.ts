import type { CreateTransaction, Transaction } from '@budget/shared';
import { markDuplicates, type PreviewRow } from './duplicates';
import { parseCsv } from './parse';

export type { PreviewRow };

/**
 * The import preview: parsed rows plus which of them are currently chosen
 * for import. Immutable — toggleRow returns a new value.
 */
export interface Preview {
  rows: PreviewRow[];
  selected: ReadonlySet<number>;
}

export type BuildPreviewResult = { ok: true; preview: Preview } | { ok: false; error: string };

type ExistingTransaction = Pick<Transaction, 'date' | 'amountCents' | 'description'>;

/**
 * Parse a pasted/uploaded CSV against the user's existing transactions.
 * Valid rows start selected; duplicates and invalid rows start excluded
 * (duplicates can be opted back in, invalid rows never can).
 */
export function buildPreview(csvText: string, existing: ExistingTransaction[]): BuildPreviewResult {
  const result = parseCsv(csvText);
  if (!result.ok) return result;
  const rows = markDuplicates(result.rows, existing);
  const selected = new Set(
    rows.filter((r) => r.status === 'valid' && !r.duplicate).map((r) => r.index),
  );
  return { ok: true, preview: { rows, selected } };
}

export function toggleRow(preview: Preview, index: number, included: boolean): Preview {
  const row = preview.rows.find((r) => r.index === index);
  if (!row || row.status !== 'valid') return preview;
  const selected = new Set(preview.selected);
  if (included) selected.add(index);
  else selected.delete(index);
  return { rows: preview.rows, selected };
}

export function selectionSummary(preview: Preview) {
  return {
    selectedCount: preview.selected.size,
    totalRows: preview.rows.length,
    invalidCount: preview.rows.filter((r) => r.status === 'invalid').length,
  };
}

export function selectedTransactions(preview: Preview): CreateTransaction[] {
  return preview.rows
    .filter(
      (r): r is Extract<PreviewRow, { status: 'valid' }> =>
        r.status === 'valid' && preview.selected.has(r.index),
    )
    .map((r) => r.transaction);
}
