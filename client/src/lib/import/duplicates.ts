import type { ImportRow } from './normalize';

interface DupFields {
  date: string;
  amountCents: number;
  description: string;
}

export function dupKey({ date, amountCents, description }: DupFields): string {
  const normalized = description.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${date}|${amountCents}|${normalized}`;
}

export type PreviewRow =
  | Extract<ImportRow, { status: 'invalid' }>
  | (Extract<ImportRow, { status: 'valid' }> & { duplicate: boolean });

/**
 * Flags valid rows that match an existing transaction (or an earlier row in
 * the same batch) on date + amount + normalized description.
 */
export function markDuplicates(rows: ImportRow[], existing: DupFields[]): PreviewRow[] {
  const seen = new Set(existing.map(dupKey));
  return rows.map((row) => {
    if (row.status !== 'valid') return row;
    const key = dupKey(row.transaction);
    const duplicate = seen.has(key);
    seen.add(key);
    return { ...row, duplicate };
  });
}
