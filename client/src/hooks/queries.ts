import type { TransactionFilters } from '@budget/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => api.listTransactions(filters),
    placeholderData: keepPreviousData,
  });
}

export function useSummary(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['summary', filters],
    queryFn: () => api.getSummary(filters),
    placeholderData: keepPreviousData,
  });
}
