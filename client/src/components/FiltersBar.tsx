import { CATEGORIES, type TransactionType } from '@budget/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterState {
  type: TransactionType | 'all';
  category: string;
  search: string;
}

export const DEFAULT_FILTERS: FilterState = { type: 'all', category: 'all', search: '' };

const TYPE_ITEMS = [
  { value: 'all', label: 'All types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

const CATEGORY_ITEMS = [
  { value: 'all', label: 'All categories' },
  ...CATEGORIES.map((c) => ({ value: c, label: c })),
];

interface FiltersBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function FiltersBar({ filters, onChange }: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-48 flex-1">
        <Label htmlFor="filter-search" className="sr-only">
          Search descriptions
        </Label>
        <Input
          id="filter-search"
          type="search"
          placeholder="Search descriptions…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <Select
        items={TYPE_ITEMS}
        value={filters.type}
        onValueChange={(value) => onChange({ ...filters, type: value as FilterState['type'] })}
      >
        <SelectTrigger aria-label="Filter by type">
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
      <Select
        items={CATEGORY_ITEMS}
        value={filters.category}
        onValueChange={(value) => onChange({ ...filters, category: value ?? 'all' })}
      >
        <SelectTrigger aria-label="Filter by category">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORY_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
