'use client';

import { MapPin, Box, ChevronRight } from 'lucide-react';

interface WarehouseListItemProps {
  warehouse: {
    id: string;
    name: string;
    location: string;
    itemCount?: number;
  };
  onClick?: (id: string) => void;
}

export default function WarehouseListItem({
  warehouse,
  onClick,
}: WarehouseListItemProps) {
  return (
    <div
      className="flex items-center gap-4 p-4 bg-card border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onClick?.(warehouse.id)}
      data-testid={`item-warehouse-${warehouse.id}`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{warehouse.name}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{warehouse.location}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {warehouse.itemCount !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <Box className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{warehouse.itemCount}</span>
          </div>
        )}
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  );
}
