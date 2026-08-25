import type { Transaction } from '@budget/shared';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCents } from '@/lib/format';

interface DeleteTransactionDialogProps {
  transaction: Transaction | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<unknown>;
  isPending: boolean;
}

export function DeleteTransactionDialog({
  transaction,
  onOpenChange,
  onConfirm,
  isPending,
}: DeleteTransactionDialogProps) {
  return (
    <AlertDialog open={transaction !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            {transaction
              ? `"${transaction.description}" (${formatCents(transaction.amountCents)} on ${transaction.date}) will be permanently removed.`
              : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={async () => {
              if (!transaction) return;
              await onConfirm(transaction.id);
              onOpenChange(false);
            }}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
