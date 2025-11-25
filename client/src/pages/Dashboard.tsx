import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import StatsCard from '@/components/StatsCard';
import InventoryListItem from '@/components/InventoryListItem';
import FloatingActionButton from '@/components/FloatingActionButton';
import RoleBadge from '@/components/RoleBadge';
import ThemeToggle from '@/components/ThemeToggle';
import { Package, AlertTriangle, TrendingUp, Warehouse, Plus } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import type { Item, Warehouse as WarehouseType, Ledger } from '@shared/schema';

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const { data: items, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ['/api/items'],
  });

  const { data: warehouses, isLoading: warehousesLoading } = useQuery<WarehouseType[]>({
    queryKey: ['/api/warehouses'],
  });

  const { data: ledgerEntries, isLoading: ledgerLoading } = useQuery<Ledger[]>({
    queryKey: ['/api/ledger'],
    enabled: !!user,
  });

  const recentItems =
    (ledgerEntries
      ?.slice(0, 3)
      .map((entry) => {
        const item = items?.find((i) => i.id === entry.itemId);
        const warehouse = warehouses?.find((w) => w.id === entry.warehouseId);
        if (!item) return null;

        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          type: item.type,
          status: 'in_stock' as const,
          warehouse: warehouse?.name || 'Unknown',
          quantity: entry.quantity,
        };
      })
      .filter(Boolean) as any[]) || [];

  return (
    <div className="min-h-screen bg-background pb-16">
      <TopBar
        title="Dashboard"
        showSearch
        showNotifications
        onMenuClick={() => setMenuOpen(!menuOpen)}
        onSearchClick={() => console.log('Search clicked')}
      />

      <main className="px-4 pt-4 space-y-6">
        {/* User Info */}
        <Card data-testid="card-user-info">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <h2 className="text-lg font-medium">Welcome back!</h2>
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-user-name">
                {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user?.role && <RoleBadge role={user.role} />}
              <ThemeToggle />
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            title="Total Items"
            value={itemsLoading ? '...' : (items?.length || 0).toString()}
            subtitle={user?.role === 'manager' ? 'In system' : 'Active inventory'}
            icon={Package}
            onClick={() => console.log('Navigate to inventory')}
            data-testid="card-total-items"
          />
          <StatsCard
            title="Activity"
            value={ledgerLoading ? '...' : (ledgerEntries?.length || 0).toString()}
            subtitle="Total movements"
            icon={TrendingUp}
            data-testid="card-activity"
          />
          <StatsCard
            title="Warehouses"
            value={warehousesLoading ? '...' : (warehouses?.length || 0).toString()}
            subtitle={user?.role === 'manager' ? 'Assigned to me' : 'Active locations'}
            icon={Warehouse}
            data-testid="card-warehouses"
          />
          <StatsCard
            title="This Month"
            value={
              ledgerLoading
                ? '...'
                : (
                    ledgerEntries?.filter((e) => {
                      const entryDate = new Date(e.createdAt);
                      const now = new Date();
                      return (
                        entryDate.getMonth() === now.getMonth() &&
                        entryDate.getFullYear() === now.getFullYear() &&
                        e.action === 'in'
                      );
                    }).length || 0
                  ).toString()
            }
            subtitle="Items received"
            icon={AlertTriangle}
            data-testid="card-this-month"
          />
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium">Recent Activity</h2>
            <button
              className="text-sm text-primary hover-elevate px-2 py-1 rounded"
              onClick={() => console.log('View all')}
              data-testid="button-view-all"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {ledgerLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : recentItems.length > 0 ? (
              recentItems.map((item) => (
                <InventoryListItem
                  key={item.id}
                  {...item}
                  onClick={() => console.log('Item clicked:', item.id)}
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No recent activity
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <FloatingActionButton
        icon={Plus}
        label="Add Item"
        onClick={() => console.log('Add item clicked')}
      />

      <BottomNav />
    </div>
  );
}
