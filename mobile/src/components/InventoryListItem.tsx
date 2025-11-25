import { Badge } from "./ui/badge";
import { ChevronRight, Package } from "lucide-react";

interface InventoryListItemProps {
  id: string;
  name: string;
  sku: string;
  type: "serialized" | "non-serialized";
  quantity?: number;
  status: "in_stock" | "low_stock" | "out_of_stock" | "issued" | "under_repair";
  warehouse?: string;
  onClick?: () => void;
}

const statusConfig = {
  in_stock: { label: "In Stock", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
  low_stock: { label: "Low Stock", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" },
  out_of_stock: { label: "Out of Stock", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" },
  issued: { label: "Issued", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" },
  under_repair: { label: "Under Repair", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100" },
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
      className="flex items-center gap-3 p-4 bg-card border border-card-border rounded-lg hover-elevate active-elevate-2 cursor-pointer"
      onClick={onClick}
      data-testid={`item-inventory-${id}`}
    >
      <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-lg">
        <Package className="w-6 h-6 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base truncate" data-testid={`text-name-${id}`}>{name}</h3>
        <p className="text-sm text-muted-foreground">
          SKU: {sku} • {type === "serialized" ? "Serialized" : "Batch"}
        </p>
        {warehouse && (
          <p className="text-xs text-muted-foreground mt-0.5">{warehouse}</p>
        )}
      </div>
      
      <div className="flex flex-col items-end gap-1">
        <Badge className={statusInfo.className} data-testid={`badge-status-${id}`}>
          {statusInfo.label}
        </Badge>
        {type === "non-serialized" && quantity !== undefined && (
          <span className="text-sm font-mono font-medium" data-testid={`text-quantity-${id}`}>
            Qty: {quantity}
          </span>
        )}
      </div>
      
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </div>
  );
}
