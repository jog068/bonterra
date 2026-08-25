import type { CreateTransaction, Summary, Transaction, TransactionFilters } from '@budget/shared';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let message = res.statusText;
    let fieldErrors: Record<string, string[]> | undefined;
    try {
      const body = await res.json();
      message = body.error?.message ?? message;
      fieldErrors = body.error?.fieldErrors;
    } catch {
      // non-JSON error body; keep the status text
    }
    throw new ApiError(message, res.status, fieldErrors);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function toQueryString(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.category) params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  listTransactions: (filters: TransactionFilters = {}) =>
    request<Transaction[]>(`/api/transactions${toQueryString(filters)}`),
  createTransaction: (input: CreateTransaction) =>
    request<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(input) }),
  updateTransaction: (id: string, input: CreateTransaction) =>
    request<Transaction>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  deleteTransaction: (id: string) =>
    request<void>(`/api/transactions/${id}`, { method: 'DELETE' }),
  getSummary: (filters: TransactionFilters = {}) =>
    request<Summary>(`/api/summary${toQueryString(filters)}`),
  importTransactions: (transactions: CreateTransaction[]) =>
    request<{ inserted: number }>('/api/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    }),
};
