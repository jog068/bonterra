import type { Transaction, TransactionFilters } from '@budget/shared';
import { useMemo, useState } from 'react';
import { DeleteTransactionDialog } from '@/components/DeleteTransactionDialog';
import { DEFAULT_FILTERS, FiltersBar, type FilterState } from '@/components/FiltersBar';
import {
  TransactionFormDialog,
  transactionToFormValues,
} from '@/components/TransactionFormDialog';
import { TransactionTable } from '@/components/TransactionTable';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
} from '@/hooks/mutations';
import { useTransactions } from '@/hooks/queries';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export default function App() {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const apiFilters: TransactionFilters = useMemo(
    () => ({
      type: filters.type === 'all' ? undefined : filters.type,
      category: filters.category === 'all' ? undefined : filters.category,
      search: debouncedSearch.trim() === '' ? undefined : debouncedSearch.trim(),
    }),
    [filters.type, filters.category, debouncedSearch],
  );

  const { data: transactions, isPending, isError, error } = useTransactions(apiFilters);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Budget Tracker</h1>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardAction>
            <Button onClick={() => setAddOpen(true)}>Add transaction</Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <FiltersBar filters={filters} onChange={setFilters} />
          {isPending ? (
            <p className="text-muted-foreground py-8 text-center">Loading…</p>
          ) : isError ? (
            <p role="alert" className="text-destructive py-8 text-center">
              {error.message}
            </p>
          ) : (
            <TransactionTable
              transactions={transactions}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          )}
        </CardContent>
      </Card>
      <TransactionFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add transaction"
        description="Log an income or expense."
        submitLabel="Add"
        onSubmit={(values) => createTransaction.mutateAsync(values)}
      />
      <TransactionFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="Edit transaction"
        description="Update this income or expense."
        submitLabel="Save changes"
        defaultValues={editing ? transactionToFormValues(editing) : undefined}
        onSubmit={(values) => {
          if (!editing) return Promise.resolve();
          return updateTransaction.mutateAsync({ id: editing.id, input: values });
        }}
      />
      <DeleteTransactionDialog
        transaction={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={(id) => deleteTransaction.mutateAsync(id)}
        isPending={deleteTransaction.isPending}
      />
    </main>
  );
}
