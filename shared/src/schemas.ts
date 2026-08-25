import { z } from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRealCalendarDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth;
}

/** Calendar date as YYYY-MM-DD — transactions carry no time or timezone. */
export const dateStringSchema = z
  .string()
  .regex(DATE_RE, 'Date must be YYYY-MM-DD')
  .refine(isRealCalendarDate, 'Not a real calendar date');

export const transactionTypeSchema = z.enum(['income', 'expense']);

export const createTransactionSchema = z.object({
  date: dateStringSchema,
  description: z.string().trim().min(1, 'Description is required').max(200),
  amountCents: z.number().int('Amount must be whole cents').positive('Amount must be positive'),
  type: transactionTypeSchema,
  category: z.string().trim().min(1, 'Category is required').max(50),
});

export const transactionSchema = createTransactionSchema.extend({
  id: z.string(),
});

export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
