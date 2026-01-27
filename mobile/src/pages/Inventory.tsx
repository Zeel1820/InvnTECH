import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import SearchBar from "../components/SearchBar";
import FilterChips from "../components/FilterChips";
import InventoryListItem from "../components/InventoryListItem";
import EmptyState from "../components/EmptyState";
import FloatingActionButton from "../components/FloatingActionButton";
import { Button } from "../components/ui/button";
import { Filter, Plus, Package } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

//todo: remove mock functionality
const mockInventory = [
  {
    id: "1",
    name: "MacBook Pro 16-inch",
    sku: "LAPTOP-MBP16-001",
    type: "serialized" as const,
    status: "in_stock" as const,
    warehouse: "Main Warehouse",
  },
  {
    id: "2",
    name: "Office Pencils (Box)",
    sku: "STAT-PENCIL-BLK",
    type: "non-serialized" as const,
    quantity: 150,
    status: "low_stock" as const,
    warehouse: "Office Supplies",
  },
  {
    id: "3",
    name: "Dell Monitor 27-inch",
    sku: "MON-DELL27-003",
    type: "serialized" as const,
    status: "issued" as const,
    warehouse: "IT Department",
  },
  {
    id: "4",
    name: "HP Laptop",
    sku: "LAPTOP-HP-002",
    type: "serialized" as const,
    status: "under_repair" as const,
    warehouse: "Main Warehouse",
  },
  {
    id: "5",
    name: "Wireless Mouse",
    sku: "ACC-MOUSE-WL",
    type: "non-serialized" as const,
    quantity: 0,
    status: "out_of_stock" as const,
    warehouse: "IT Department",
  },
];

export default function Inventory() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState([
    { id: "1", label: "Type", value: "Serialized" },
    { id: "2", label: "Warehouse", value: "Main" },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [items] = useState(mockInventory);

  return (
    <div className="min-h-screen bg-background pb-16">
      <TopBar
        title="Inventory"
        showSearch={false}
        onMenuClick={() => console.log("Menu clicked")}
      />

      <main className="px-4 pt-4 space-y-4">
        {/* Search */}
        <SearchBar
          placeholder="Search by SKU, name, or serial..."
          onSearch={(query) => {
            console.log("Search:", query);
            setSearchQuery(query);
          }}
          onClear={() => setSearchQuery("")}
        />

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => console.log("Open filter dialog")}
            data-testid="button-filter"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <div className="flex-1">
            <FilterChips
              filters={filters}
              onRemove={(id) => {
                console.log("Remove filter:", id);
                setFilters(filters.filter((f) => f.id !== id));
              }}
            />
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {items.length} items
        </p>

        {/* Inventory List */}
        {items.length > 0 ? (
          <div className="space-y-3 pb-4">
            {items.map((item) => (
              <InventoryListItem
                key={item.id}
                {...item}
                onClick={() => console.log("View item:", item.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No items found"
            description="Try adjusting your search or filters to find what you're looking for."
            actionLabel="Clear Filters"
            onAction={() => setFilters([])}
          />
        )}
      </main>

      <FloatingActionButton
        icon={Plus}
        label="Add Item"
        onClick={() => setLocation("/items")}
        data-testid="button-add-item"
      />

      <BottomNav />
    </div>
  );
}
