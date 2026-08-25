import { zodResolver } from '@hookform/resolvers/zod';
import {
  CATEGORIES,
  createTransactionSchema,
  type CreateTransaction,
  type Transaction,
} from '@budget/shared';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/api';
import { AMOUNT_RE, centsToDollars, dollarsToCents } from '@/lib/money';

// Form-local schema: amount is entered in dollars and converted to integer
// cents at the API boundary; everything else reuses the shared contract.
const formSchema = z.object({
  date: createTransactionSchema.shape.date,
  description: createTransactionSchema.shape.description,
  amount: z
    .string()
    .regex(AMOUNT_RE, 'Enter a positive amount like 12.34')
    .refine((value) => Number(value) > 0, 'Amount must be greater than zero'),
  type: createTransactionSchema.shape.type,
  category: createTransactionSchema.shape.category,
});

export type TransactionFormValues = z.infer<typeof formSchema>;

export function transactionToFormValues(t: Transaction): TransactionFormValues {
  return {
    date: t.date,
    description: t.description,
    amount: centsToDollars(t.amountCents),
    type: t.type,
    category: t.category,
  };
}

const EMPTY_VALUES: TransactionFormValues = {
  date: '',
  description: '',
  amount: '',
  type: 'expense',
  category: '',
};

const TYPE_ITEMS = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

const CATEGORY_ITEMS = CATEGORIES.map((c) => ({ value: c, label: c }));

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  defaultValues?: TransactionFormValues;
  onSubmit: (values: CreateTransaction) => Promise<unknown>;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  defaultValues,
  onSubmit,
}: TransactionFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  // Re-seed the form whenever the dialog opens for a different transaction.
  useEffect(() => {
    if (open) reset(defaultValues ?? EMPTY_VALUES);
  }, [open, defaultValues, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        date: values.date,
        description: values.description,
        amountCents: dollarsToCents(values.amount),
        type: values.type,
        category: values.category,
      });
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        for (const [field, messages] of Object.entries(err.fieldErrors)) {
          const name = field === 'amountCents' ? 'amount' : (field as keyof TransactionFormValues);
          setError(name as keyof TransactionFormValues, { message: messages[0] });
        }
      } else {
        setError('root', { message: err instanceof Error ? err.message : 'Something went wrong' });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="tx-date">Date</FieldLabel>
              <Input id="tx-date" type="date" aria-invalid={!!errors.date} {...register('date')} />
              <FieldError errors={[errors.date]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="tx-amount">Amount ($)</FieldLabel>
              <Input
                id="tx-amount"
                inputMode="decimal"
                placeholder="0.00"
                aria-invalid={!!errors.amount}
                {...register('amount')}
              />
              <FieldError errors={[errors.amount]} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="tx-description">Description</FieldLabel>
            <Input
              id="tx-description"
              placeholder="e.g. Groceries"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            <FieldError errors={[errors.description]} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="tx-type">Type</FieldLabel>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select items={TYPE_ITEMS} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tx-type" className="w-full" aria-invalid={!!errors.type}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.type]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="tx-category">Category</FieldLabel>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    items={CATEGORY_ITEMS}
                    value={field.value === '' ? null : field.value}
                    onValueChange={(value) => field.onChange(value ?? '')}
                  >
                    <SelectTrigger
                      id="tx-category"
                      className="w-full"
                      aria-invalid={!!errors.category}
                    >
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.category]} />
            </Field>
          </div>
          {errors.root && (
            <p role="alert" className="text-destructive text-sm">
              {errors.root.message}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
