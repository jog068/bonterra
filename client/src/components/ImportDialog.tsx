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
import { markDuplicates, type PreviewRow } from '@/lib/import/duplicates';
import { parseCsv } from '@/lib/import/parse';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (transactions: CreateTransaction[]) => Promise<{ inserted: number }>;
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [csvText, setCsvText] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ rows: PreviewRow[]; selected: Set<number> } | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Unfiltered list, used to flag probable re-imports in the preview. Preview
  // is gated on it so duplicate detection never silently runs against nothing.
  const { data: existingTransactions } = useTransactions({});

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
    if (existingTransactions === undefined) return; // button is disabled until loaded
    const result = parseCsv(csvText);
    if (!result.ok) {
      setInputError(result.error);
      return;
    }
    setInputError(null);
    const rows = markDuplicates(result.rows, existingTransactions);
    setPreview({
      rows,
      // Duplicates start excluded; the user can still opt them in.
      selected: new Set(
        rows.filter((r) => r.status === 'valid' && !r.duplicate).map((r) => r.index),
      ),
    });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setCsvText(await file.text());
    setInputError(null);
  };

  const toggleRow = (index: number, checked: boolean) => {
    if (!preview) return;
    const selected = new Set(preview.selected);
    if (checked) selected.add(index);
    else selected.delete(index);
    setPreview({ ...preview, selected });
  };

  const handleImport = async () => {
    if (!preview) return;
    const chosen = preview.rows.filter(
      (r): r is Extract<PreviewRow, { status: 'valid' }> =>
        r.status === 'valid' && preview.selected.has(r.index),
    );
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onImport(chosen.map((r) => r.transaction));
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

  const selectedCount = preview?.selected.size ?? 0;

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
                disabled={csvText.trim() === '' || existingTransactions === undefined}
              >
                Preview
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm" aria-live="polite">
              <strong>{selectedCount}</strong> of {preview.rows.length} rows will be imported
              {preview.rows.some((r) => r.status === 'invalid') && (
                <span className="text-muted-foreground">
                  {' '}
                  ({preview.rows.filter((r) => r.status === 'invalid').length} invalid)
                </span>
              )}
            </p>
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
                            onCheckedChange={(checked) => toggleRow(row.index, checked === true)}
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
