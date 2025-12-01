'use client';

import { Badge } from './ui/badge';
import { X } from 'lucide-react';

interface FilterChip {
  id: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  filters: FilterChip[];
  onRemove?: (id: string) => void;
}

export default function FilterChips({ filters, onRemove }: FilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="flex items-center gap-1 pl-3 pr-2 py-1.5"
          data-testid={`badge-filter-${filter.id}`}
        >
          <span className="text-xs">
            {filter.label}: {filter.value}
          </span>
          {onRemove && (
            <button
              onClick={() => onRemove(filter.id)}
              className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              data-testid={`button-remove-filter-${filter.id}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </Badge>
      ))}
    </div>
  );
}
