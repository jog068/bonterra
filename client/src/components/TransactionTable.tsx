import type { Transaction } from '@budget/shared';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCents } from '@/lib/format';
import { cn } from '@/lib/utils';

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">No transactions found.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="whitespace-nowrap">{t.date}</TableCell>
            <TableCell>{t.description}</TableCell>
            <TableCell>{t.category}</TableCell>
            <TableCell>
              <Badge variant={t.type === 'income' ? 'default' : 'secondary'}>{t.type}</Badge>
            </TableCell>
            <TableCell
              className={cn(
                'text-right font-medium tabular-nums',
                t.type === 'income' ? 'text-green-700' : 'text-foreground',
              )}
            >
              {t.type === 'income' ? '+' : '−'}
              {formatCents(t.amountCents)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
