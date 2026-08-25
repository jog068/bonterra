import { useQuery } from '@tanstack/react-query';
import { TransactionTable } from '@/components/TransactionTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

export default function App() {
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
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className="text-muted-foreground py-8 text-center">Loading…</p>
          ) : isError ? (
            <p role="alert" className="text-destructive py-8 text-center">
              {error.message}
            </p>
          ) : (
            <TransactionTable transactions={transactions} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
