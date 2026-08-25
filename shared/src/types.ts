export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  /** Calendar date the transaction occurred, YYYY-MM-DD */
  date: string;
  description: string;
  /** Stored as integer cents to avoid floating-point drift */
  amountCents: number;
  type: TransactionType;
  category: string;
}
