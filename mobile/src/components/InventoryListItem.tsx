'use client';

import { Badge, BadgeProps } from './ui/badge';
import { ChevronRight, Package } from 'lucide-react';

interface InventoryListItemProps {
  id: string;
  name: string;
  sku: string;
  type: 'serialized' | 'non-serialized';
  quantity?: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'issued' | 'under_repair';
  warehouse?: string;
  onClick?: () => void;
}

type StatusVariant = 'success' | 'warning' | 'destructive' | 'info' | 'secondary';

const statusConfig: Record<InventoryListItemProps['status'], { label: string; variant: BadgeProps['variant'] } > = {
  in_stock: { label: 'In Stock', variant: 'success' },
  low_stock: { label: 'Low Stock', variant: 'warning' },
  out_of_stock: { label: 'Out of Stock', variant: 'destructive' },
  issued: { label: 'Issued', variant: 'info' },
  under_repair: { label: 'Under Repair', variant: 'secondary' },
};

export default function InventoryListItem({
  id,
  name,
  sku,
  type,
  quantity,
  status,
  warehouse,
  onClick,
}: InventoryListItemProps) {
  const statusInfo = statusConfig[status];

  return (
    <div
      className="flex items-center gap-4 p-4 bg-card border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
      data-testid={`item-inventory-${id}`}
    >
      <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-lg flex-shrink-0">
        <Package className="w-6 h-6 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-base truncate" data-testid={`text-name-${id}`}>
          {name}
        </p>
        <p className="text-sm text-muted-foreground">
          SKU: {sku} &bull; {type === 'serialized' ? 'Serialized' : 'Batch'}
        </p>
        {warehouse && (
          <p className="text-xs text-muted-foreground mt-0.5">{warehouse}</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 text-right">
        <Badge variant={statusInfo.variant} data-testid={`badge-status-${id}`}>
          {statusInfo.label}
        </Badge>
        {type === 'non-serialized' && quantity !== undefined && (
          <p
            className="text-sm font-mono font-medium" 
            data-testid={`text-quantity-${id}`}
          >
            Qty: {quantity}
          </p>
        )}
      </div>

      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </div>
  );
}
