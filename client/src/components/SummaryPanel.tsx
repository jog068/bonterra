import type { Summary } from '@budget/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCents } from '@/lib/format';
import { cn } from '@/lib/utils';

interface SummaryPanelProps {
  summary: Summary | undefined;
  isFiltered: boolean;
}

function StatTile({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className={cn('text-2xl font-semibold', valueClassName)}>{value}</p>
      </CardContent>
    </Card>
  );
}

export function SummaryPanel({ summary, isFiltered }: SummaryPanelProps) {
  return (
    <section aria-label="Summary" className="space-y-2">
      {isFiltered && (
        <Badge variant="outline">Filtered view — totals reflect the current filters</Badge>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total income" value={summary ? formatCents(summary.totalIncomeCents) : '—'} />
        <StatTile
          label="Total expenses"
          value={summary ? formatCents(summary.totalExpenseCents) : '—'}
        />
        <StatTile
          label="Net balance"
          value={summary ? formatCents(summary.netCents) : '—'}
          valueClassName={
            summary && summary.netCents < 0 ? 'text-destructive' : 'text-green-700'
          }
        />
      </div>
    </section>
  );
}
