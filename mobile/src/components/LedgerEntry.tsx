'use client';

import { Badge } from './ui/badge';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  ArrowRightLeft,
  LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LedgerEntryProps {
  id: string;
  type: 'in' | 'out' | 'adjust' | 'transfer';
  quantity: number;
  timestamp: string;
  user: string;
  warehouse?: string;
  reason?: string;
  reference?: string;
  isLast?: boolean;
}

const typeConfig: Record<
  LedgerEntryProps['type'],
  { label: string; icon: LucideIcon; className: string }
> = {
  in: {
    label: 'Stock In',
    icon: ArrowDownCircle,
    className: 'text-success-foreground',
  },
  out: {
    label: 'Stock Out',
    icon: ArrowUpCircle,
    className: 'text-destructive-foreground',
  },
  adjust: {
    label: 'Adjustment',
    icon: RefreshCw,
    className: 'text-warning-foreground',
  },
  transfer: {
    label: 'Transfer',
    icon: ArrowRightLeft,
    className: 'text-info-foreground',
  },
};

export default function LedgerEntry({
  id,
  type,
  quantity,
  timestamp,
  user,
  warehouse,
  reason,
  reference,
  isLast = false,
}: LedgerEntryProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative pl-8 pb-6',
        !isLast && 'border-l-2 border-border'
      )}
      data-testid={`entry-ledger-${id}`}
    >
      <div
        className={cn(
          'absolute left-0 -translate-x-1/2 top-0 w-7 h-7 rounded-full bg-background border-2 flex items-center justify-center',
          config.className.replace('-foreground', '')
        )}
      >
        <Icon className={cn('w-4 h-4', config.className)} />
      </div>

      <div className="bg-card p-3.5 rounded-lg border">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant={type} data-testid={`badge-type-${id}`}>
                {config.label}
              </Badge>
              <p className="font-mono font-medium" data-testid={`text-quantity-${id}`}>
                {type === 'out' || (type === 'adjust' && quantity < 0) ? '' : '+'}
                {quantity}
              </p>
            </div>

            <p className="text-sm text-muted-foreground">{timestamp}</p>
            <p className="text-sm mt-1.5">By: {user}</p>
            {warehouse && (
              <p className="text-sm text-muted-foreground">{warehouse}</p>
            )}
            {reason && <p className="text-sm mt-1 italic">Reason: {reason}</p>}
            {reference && (
              <p className="text-xs font-mono text-muted-foreground mt-1.5">
                Ref: {reference}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
