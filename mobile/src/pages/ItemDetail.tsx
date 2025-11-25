import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import QRCodeDisplay from '../components/QRCodeDisplay';
import LedgerEntry from '../components/LedgerEntry';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { useLocation } from 'wouter';
import { Edit, Trash2 } from 'lucide-react';

//todo: remove mock functionality
const mockItem = {
  id: '1',
  name: 'MacBook Pro 16-inch',
  sku: 'LAPTOP-MBP16-001',
  type: 'serialized' as const,
  serialNumber: 'SN123456789',
  status: 'in_stock',
  warehouse: 'Main Warehouse',
  assignedTo: null,
  warrantyEnd: '2025-12-31',
  description: '16-inch MacBook Pro with M2 Max chip, 32GB RAM, 1TB SSD',
};

const mockLedger = [
  {
    id: '1',
    type: 'in' as const,
    quantity: 1,
    timestamp: '2024-01-15 10:30 AM',
    user: 'John Admin',
    warehouse: 'Main Warehouse',
    reason: 'Initial stock - New purchase',
    reference: 'PO-2024-001',
  },
  {
    id: '2',
    type: 'adjust' as const,
    quantity: 0,
    timestamp: '2024-01-20 02:15 PM',
    user: 'Jane Manager',
    warehouse: 'Main Warehouse',
    reason: 'Status update - Quality check completed',
  },
];

export default function ItemDetail() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-16">
      <TopBar title="Item Details" showBack onBackClick={() => setLocation('/inventory')} />

      <main className="px-4 pt-4 space-y-4">
        {/* Item Header */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-medium" data-testid="text-item-name">
                  {mockItem.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">SKU: {mockItem.sku}</p>
                {mockItem.serialNumber && (
                  <p className="text-sm font-mono text-muted-foreground">
                    Serial: {mockItem.serialNumber}
                  </p>
                )}
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                In Stock
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="details" data-testid="tab-details">
              Details
            </TabsTrigger>
            <TabsTrigger value="qr" data-testid="tab-qr">
              QR Code
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Type</label>
                  <p className="font-medium">
                    {mockItem.type === 'serialized' ? 'Serialized' : 'Non-Serialized'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Warehouse</label>
                  <p className="font-medium">{mockItem.warehouse}</p>
                </div>
                {mockItem.description && (
                  <div>
                    <label className="text-sm text-muted-foreground">Description</label>
                    <p className="text-sm">{mockItem.description}</p>
                  </div>
                )}
                {mockItem.warrantyEnd && (
                  <div>
                    <label className="text-sm text-muted-foreground">Warranty Ends</label>
                    <p className="font-medium">{mockItem.warrantyEnd}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => console.log('Edit item')}
                data-testid="button-edit"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => console.log('Delete item')}
                data-testid="button-delete"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="mt-4">
            <QRCodeDisplay
              value={`${mockItem.sku}-${mockItem.serialNumber}`}
              title={mockItem.name}
              subtitle={`SKU: ${mockItem.sku} • Serial: ${mockItem.serialNumber}`}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <h3 className="font-medium">Transaction History</h3>
              </CardHeader>
              <CardContent className="pt-2">
                {mockLedger.map((entry) => (
                  <LedgerEntry key={entry.id} {...entry} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
