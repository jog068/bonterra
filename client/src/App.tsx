import type { Transaction } from '@budget/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DeleteTransactionDialog } from '@/components/DeleteTransactionDialog';
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
import { api } from '@/lib/api';

export default function App() {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const {
    data: transactions,
    isPending,
    isError,
    error,
  } = useQuery({ queryKey: ['transactions'], queryFn: api.listTransactions });

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
        <CardContent>
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
