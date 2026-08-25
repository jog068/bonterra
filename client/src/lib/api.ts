import type { Transaction } from '@budget/shared';

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

export const api = {
  listTransactions: () => request<Transaction[]>('/api/transactions'),
};
