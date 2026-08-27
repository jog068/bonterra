import type { CreateTransaction } from '@budget/shared';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useTransactions } from '@/hooks/queries';
import { ApiError } from '@/lib/api';
import { formatCents } from '@/lib/format';
import {
  buildPreview,
  selectedTransactions,
  selectionSummary,
  toggleRow,
  type Preview,
} from '@/lib/import/preview';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (transactions: CreateTransaction[]) => Promise<{ inserted: number }>;
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [csvText, setCsvText] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Unfiltered list, used to flag probable re-imports in the preview. Preview
  // waits for it while loading; if it errors, importing stays possible but the
  // preview says the duplicate check is off rather than silently skipping it.
  const { data: existingTransactions, isError: duplicateCheckUnavailable } = useTransactions({});

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCsvText('');
      setInputError(null);
      setPreview(null);
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  };

  const handlePreview = () => {
    if (existingTransactions === undefined && !duplicateCheckUnavailable) return; // still loading
    const result = buildPreview(csvText, existingTransactions ?? []);
    if (!result.ok) {
      setInputError(result.error);
      return;
    }
    setInputError(null);
    setPreview(result.preview);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setCsvText(await file.text());
    setInputError(null);
  };

  const handleToggle = (index: number, checked: boolean) => {
    setPreview((current) => (current ? toggleRow(current, index, checked) : current));
  };

  const handleImport = async () => {
    if (!preview) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onImport(selectedTransactions(preview));
      handleOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors?.rows) {
        setSubmitError(err.fieldErrors.rows.join('; '));
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Import failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = preview ? selectionSummary(preview) : null;
  const selectedCount = summary?.selectedCount ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            {preview
              ? 'Review the parsed rows, then import the ones you want.'
              : 'Paste a bank export. Needs date, description, and amount columns; type and category are optional.'}
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="import-csv">CSV content</Label>
              <Textarea
                id="import-csv"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={'date,description,amount\n2026-08-01,Paycheck,3200.00\n2026-08-03,Groceries,-84.25'}
                className="min-h-40 font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-file">…or upload a .csv file</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
            {inputError && (
              <p role="alert" className="text-destructive text-sm">
                {inputError}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={
                  csvText.trim() === '' ||
                  (existingTransactions === undefined && !duplicateCheckUnavailable)
                }
              >
                Preview
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm" aria-live="polite">
              <strong>{selectedCount}</strong> of {summary?.totalRows} rows will be imported
              {(summary?.invalidCount ?? 0) > 0 && (
                <span className="text-muted-foreground">
                  {' '}
                  ({summary?.invalidCount} invalid)
                </span>
              )}
            </p>
            {duplicateCheckUnavailable && (
              <p role="alert" className="text-muted-foreground text-sm">
                Duplicate check unavailable — existing transactions couldn't be loaded, so
                re-imports won't be flagged.
              </p>
            )}
            <div className="max-h-80 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <span className="sr-only">Include</span>
                    </TableHead>
                    <TableHead>Row</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row) =>
                    row.status === 'valid' ? (
                      <TableRow key={row.index}>
                        <TableCell>
                          <Checkbox
                            aria-label={`Include row ${row.index + 1}`}
                            checked={preview.selected.has(row.index)}
                            onCheckedChange={(checked) => handleToggle(row.index, checked === true)}
                          />
                        </TableCell>
                        <TableCell>{row.index + 1}</TableCell>
                        <TableCell className="whitespace-nowrap">{row.transaction.date}</TableCell>
                        <TableCell>
                          {row.transaction.description}
                          {row.duplicate && (
                            <Badge variant="outline" className="ml-2">
                              Duplicate
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{row.transaction.category}</TableCell>
                        <TableCell>
                          <Badge
                            variant={row.transaction.type === 'income' ? 'default' : 'secondary'}
                          >
                            {row.transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCents(row.transaction.amountCents)}
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={row.index} className="opacity-70">
                        <TableCell />
                        <TableCell>{row.index + 1}</TableCell>
                        <TableCell colSpan={5}>
                          <Badge variant="destructive">Invalid</Badge>{' '}
                          <span className="text-muted-foreground text-sm">
                            {row.errors.join('; ')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
            {submitError && (
              <p role="alert" className="text-destructive text-sm">
                {submitError}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreview(null)}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={selectedCount === 0 || isSubmitting}>
                {isSubmitting
                  ? 'Importing…'
                  : `Import ${selectedCount} row${selectedCount === 1 ? '' : 's'}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
