import type { Transaction } from '@budget/shared';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionTable({ transactions, onEdit, onDelete }: TransactionTableProps) {
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
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
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
            <TableCell className="text-right whitespace-nowrap">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${t.description}`}
                onClick={() => onEdit(t)}
              >
                <PencilIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${t.description}`}
                onClick={() => onDelete(t)}
              >
                <Trash2Icon />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
