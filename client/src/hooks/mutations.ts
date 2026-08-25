import type { CreateTransaction } from '@budget/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

function useInvalidateOnSuccess() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
  };
}

export function useCreateTransaction() {
  const onSuccess = useInvalidateOnSuccess();
  return useMutation({ mutationFn: api.createTransaction, onSuccess });
}

export function useUpdateTransaction() {
  const onSuccess = useInvalidateOnSuccess();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateTransaction }) =>
      api.updateTransaction(id, input),
    onSuccess,
  });
}

export function useDeleteTransaction() {
  const onSuccess = useInvalidateOnSuccess();
  return useMutation({ mutationFn: api.deleteTransaction, onSuccess });
}
