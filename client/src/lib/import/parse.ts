import Papa from 'papaparse';
import { buildImportRow, normalizeHeader, type CanonicalField, type ImportRow } from './normalize';

const REQUIRED_FIELDS: CanonicalField[] = ['date', 'description', 'amount'];

export type ParseResult = { ok: true; rows: ImportRow[] } | { ok: false; error: string };

export function parseCsv(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header, i) => normalizeHeader(header) ?? `__unmapped_${i}`,
  });

  const fields = (parsed.meta.fields ?? []).filter(
    (f): f is CanonicalField => !f.startsWith('__unmapped_'),
  );
  const missing = REQUIRED_FIELDS.filter((f) => !fields.includes(f));
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing required column(s): ${missing.join(', ')}. Expected headers like date, description, amount (type and category are optional).`,
    };
  }

  const rows = parsed.data.map((record, index) => buildImportRow(record, index));
  if (rows.length === 0) {
    return { ok: false, error: 'No data rows found.' };
  }
  return { ok: true, rows };
}
