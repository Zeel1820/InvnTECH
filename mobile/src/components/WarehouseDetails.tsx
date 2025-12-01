'use client';

import { Button } from './ui/button';
import { MapPin, Box, Users } from 'lucide-react';

interface WarehouseDetailsProps {
  warehouse: {
    id: string;
    name: string;
    location: string;
    itemCount?: number;
    manager?: {
      name: string;
      id: string;
    };
  };
  onEdit?: (id: string) => void;
  onViewItems?: (id: string) => void;
  onViewManager?: (id: string) => void;
}

export default function WarehouseDetails({
  warehouse,
  onEdit,
  onViewItems,
  onViewManager,
}: WarehouseDetailsProps) {
  return (
    <div className="bg-card p-6 rounded-lg border w-full max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Box className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold">{warehouse.name}</h2>
        <div className="flex items-center gap-2 text-muted-foreground mt-1">
          <MapPin className="w-4 h-4" />
          <span>{warehouse.location}</span>
        </div>
      </div>

      <div className="mt-6 space-y-4 text-sm">
        {warehouse.itemCount !== undefined && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Item Count:</span>
            <span className="text-muted-foreground">{warehouse.itemCount}</span>
          </div>
        )}
        {warehouse.manager && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Manager:</span>
            <Button
              variant="link"
              className="p-0 h-auto text-muted-foreground"
              onClick={() => onViewManager?.(warehouse.manager.id)}
            >
              {warehouse.manager.name}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {onViewItems && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onViewItems(warehouse.id)}
          >
            <Box className="w-4 h-4 mr-2" />
            View Items
          </Button>
        )}
        {onEdit && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => onEdit(warehouse.id)}
          >
            Edit Warehouse
          </Button>
        )}
      </div>
    </div>
  );
}
