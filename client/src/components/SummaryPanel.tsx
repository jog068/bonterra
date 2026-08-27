import type { Summary } from '@budget/shared';
import { Card, CardContent } from '@/components/ui/card';
import { formatCents } from '@/lib/format';
import { cn } from '@/lib/utils';

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

export function SummaryPanel({ summary }: { summary: Summary | undefined }) {
  return (
    <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
      <StatTile label="Total income" value={summary ? formatCents(summary.totalIncomeCents) : '—'} />
      <StatTile
        label="Total expenses"
        value={summary ? formatCents(summary.totalExpenseCents) : '—'}
      />
      <StatTile
        label="Net balance"
        value={summary ? formatCents(summary.netCents) : '—'}
        valueClassName={summary && summary.netCents < 0 ? 'text-destructive' : 'text-green-700'}
      />
    </section>
  );
}
