import { createTransactionSchema, type CreateTransaction } from '@budget/shared';

export type CanonicalField = 'date' | 'description' | 'amount' | 'type' | 'category';

const HEADER_SYNONYMS: Record<string, CanonicalField> = {
  date: 'date',
  'transaction date': 'date',
  'posted date': 'date',
  'post date': 'date',
  'booking date': 'date',
  description: 'description',
  desc: 'description',
  memo: 'description',
  details: 'description',
  narrative: 'description',
  payee: 'description',
  amount: 'amount',
  'transaction amount': 'amount',
  value: 'amount',
  type: 'type',
  'transaction type': 'type',
  'credit/debit': 'type',
  'debit/credit': 'type',
  category: 'category',
};

export function normalizeHeader(header: string): CanonicalField | null {
  const key = header.replace(/^﻿/, '').trim().toLowerCase().replace(/\s+/g, ' ');
  return HEADER_SYNONYMS[key] ?? null;
}

/**
 * Accepts bank-export amount spellings: "$1,234.56", "-42.50", "(42.50)".
 * Returns magnitude in cents plus whether the raw value was negative.
 */
export function normalizeAmount(raw: string): { cents: number; negative: boolean } | null {
  let value = raw.trim();
  let negative = false;

  const parenthesized = /^\((.*)\)$/.exec(value);
  if (parenthesized) {
    negative = true;
    value = parenthesized[1].trim();
    if (value.startsWith('-')) return null; // "(-5)" is ambiguous; reject
  } else if (value.startsWith('-')) {
    negative = true;
    value = value.slice(1).trim();
  }
  value = value.replace(/^\$\s*/, '').replace(/,/g, '');

  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [dollars, cents = ''] = value.split('.');
  const total = Number(dollars) * 100 + Number((cents + '00').slice(0, 2));
  if (total === 0) return null;
  return { cents: total, negative };
}

/** Accepts YYYY-MM-DD or M/D/YYYY (US bank exports); returns YYYY-MM-DD. */
export function normalizeDate(raw: string): string | null {
  const value = raw.trim();
  let candidate: string | null = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    candidate = value;
  } else {
    const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (us) {
      candidate = `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
    }
  }
  if (!candidate) return null;
  const parsed = createTransactionSchema.shape.date.safeParse(candidate);
  return parsed.success ? candidate : null;
}

const TYPE_SYNONYMS: Record<string, CreateTransaction['type']> = {
  income: 'income',
  credit: 'income',
  expense: 'expense',
  debit: 'expense',
};

export function normalizeType(raw: string): CreateTransaction['type'] | null {
  return TYPE_SYNONYMS[raw.trim().toLowerCase()] ?? null;
}

export type ImportRow =
  | { index: number; status: 'valid'; transaction: CreateTransaction }
  | { index: number; status: 'invalid'; errors: string[] };

export function buildImportRow(
  record: Partial<Record<CanonicalField, string>>,
  index: number,
): ImportRow {
  const errors: string[] = [];

  const date = normalizeDate(record.date ?? '');
  if (!date) errors.push(`Unrecognized date "${record.date ?? ''}"`);

  const description = (record.description ?? '').trim();
  if (!description) errors.push('Description is blank');

  const amount = normalizeAmount(record.amount ?? '');
  if (!amount) errors.push(`Unrecognized amount "${record.amount ?? ''}"`);

  // An explicit type column wins; otherwise the amount's sign decides.
  let type: CreateTransaction['type'] | null = null;
  const rawType = (record.type ?? '').trim();
  if (rawType) {
    type = normalizeType(rawType);
    if (!type) errors.push(`Unrecognized type "${rawType}"`);
  } else if (amount) {
    type = amount.negative ? 'expense' : 'income';
  }

  const category = (record.category ?? '').trim() || 'Other';

  if (errors.length > 0 || !date || !amount || !type) {
    return { index, status: 'invalid', errors };
  }

  const candidate: CreateTransaction = {
    date,
    description,
    amountCents: amount.cents,
    type,
    category,
  };
  const parsed = createTransactionSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      index,
      status: 'invalid',
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }
  return { index, status: 'valid', transaction: parsed.data };
}
