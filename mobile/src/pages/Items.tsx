import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertItemSchema, type Item, type Warehouse, type Serial } from '../../../shared/schema';
import { z } from 'zod';
import { apiRequest, queryClient } from '../lib/queryClient';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '../components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Package, Plus, Edit, Trash2, AlertCircle, Loader2, QrCode, Printer } from 'lucide-react-native';
import { QRCodeSVG } from 'qrcode.react';
import { View, Text } from 'react-native';
import { useNavigate } from 'react-router-native';

type ItemFormData = z.infer<typeof insertItemSchema>;

interface BulkSerialResult {
  count: number;
  serials: Serial[];
}

export default function Items() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [bulkSerialQuantity, setBulkSerialQuantity] = useState<string>('');
  const [bulkSerialStartIndex, setBulkSerialStartIndex] = useState<string>('');
  const [bulkSerialWarehouse, setBulkSerialWarehouse] = useState<string>('');
  const [bulkSerialResult, setBulkSerialResult] = useState<BulkSerialResult | null>(null);
  const navigate = useNavigate();

  const {
    data: items,
    isLoading,
    error,
  } = useQuery<Item[]>({
    queryKey: ['/api/items'],
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ['/api/warehouses'],
  });

  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || user?.role === 'manager';

  const form = useForm<ItemFormData>({
    resolver: zodResolver(insertItemSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      type: 'non-serialized',
      consumptionType: 'consumable',
      category: '',
      reorderLevel: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      const res = await apiRequest('POST', '/api/items', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Item created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ItemFormData> }) => {
      const res = await apiRequest('PATCH', `/api/items/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: 'Success',
        description: 'Item updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/items/${id}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      setDeleteItem(null);
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const bulkSerialMutation = useMutation({
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: string;
      data: { quantity: number; startIndex: string; warehouseId: string };
    }) => {
      const res = await apiRequest('POST', `/api/items/${itemId}/serials/bulk`, data);
      return res.json();
    },
    onSuccess: (data: BulkSerialResult) => {
      queryClient.invalidateQueries({ queryKey: ['/api/serials'] });
      setBulkSerialResult(data);
      setBulkSerialQuantity('');
      setBulkSerialStartIndex('');
      setBulkSerialWarehouse('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    form.reset({
      sku: item.sku,
      name: item.name,
      description: item.description ?? '',
      type: item.type,
      consumptionType: item.consumptionType,
      category: item.category ?? '',
      reorderLevel: item.reorderLevel ?? undefined,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: ItemFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleOpenDialog = () => {
    setEditingItem(null);
    form.reset({
      sku: '',
      name: '',
      description: '',
      type: 'non-serialized',
      category: '',
      reorderLevel: undefined,
    });
    setBulkSerialQuantity('');
    setBulkSerialStartIndex('');
    setBulkSerialWarehouse('');
    setDialogOpen(true);
  };

  const handleBulkSerialCreate = () => {
    const currentItemId = editingItem?.id;
    const currentSku = editingItem?.sku || form.getValues('sku');

    if (!currentItemId) {
      toast({
        title: 'Error',
        description: 'Please save the item first before creating serials in bulk',
        variant: 'destructive',
      });
      return;
    }

    const qty = parseInt(bulkSerialQuantity);
    if (!qty || qty <= 0 || qty > 1000) {
      toast({
        title: 'Error',
        description: 'Quantity must be between 1 and 1000',
        variant: 'destructive',
      });
      return;
    }

    if (!bulkSerialStartIndex) {
      toast({
        title: 'Error',
        description: 'Start index is required',
        variant: 'destructive',
      });
      return;
    }

    if (!bulkSerialWarehouse) {
      toast({
        title: 'Error',
        description: 'Please select a warehouse',
        variant: 'destructive',
      });
      return;
    }

    bulkSerialMutation.mutate({
      itemId: currentItemId,
      data: {
        quantity: qty,
        startIndex: bulkSerialStartIndex,
        warehouseId: bulkSerialWarehouse,
      },
    });
  };

  const handlePrintQRCodes = () => {
    // Implement printing functionality for React Native
  };

  if (error) {
    return (
      <View className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <Text className="text-lg font-semibold mb-2" data-testid="text-error-title">
          Error Loading Items
        </Text>
        <Text className="text-sm text-muted-foreground" data-testid="text-error-message">
          {error instanceof Error ? error.message : 'An error occurred'}
        </Text>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-background pb-16">
      <TopBar
        title="Items"
        showBack={true}
        onBackClick={() => navigate('/dashboard')}
        showSearch={false}
      />

      <View className="px-4 pt-4 space-y-4">
        <View className="flex items-center justify-between mb-4">
          <Text className="text-sm text-muted-foreground">Manage your inventory items</Text>
          {canEdit && (
            <Button onPress={handleOpenDialog} data-testid="button-add-item">
              <Plus className="w-4 h-4 mr-2" />
              <Text>Add Item</Text>
            </Button>
          )}
        </View>

        {isLoading ? (
          <View className="flex items-center justify-center py-12">
            <Loader2
              className="w-8 h-8 animate-spin text-muted-foreground"
              data-testid="loader-items"
            />
          </View>
        ) : items && items.length > 0 ? (
          <View className="grid grid-cols-1 gap-3 pb-4">
            {items.map((item) => (
              <Card
                key={item.id}
                data-testid={`card-item-${item.id}`}
                className="hover-elevate cursor-pointer"
                onPress={() => handleEdit(item)}
              >
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle
                    className="text-base font-medium"
                    data-testid={`text-item-name-${item.id}`}
                  >
                    {item.name}
                  </CardTitle>
                  {canEdit && (
                    <View className="flex gap-1" onPress={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onPress={() => handleEdit(item)}
                        data-testid={`button-edit-item-${item.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onPress={() => setDeleteItem(item)}
                          data-testid={`button-delete-item-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </View>
                  )}
                </CardHeader>
                <CardContent>
                  <View className="space-y-2 text-sm">
                    <View>
                      <Text className="text-muted-foreground">SKU: </Text>
                      <Text className="font-mono" data-testid={`text-item-sku-${item.id}`}>
                        {item.sku}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-muted-foreground">Type: </Text>
                      <Text className="capitalize" data-testid={`text-item-type-${item.id}`}>
                        {item.type}
                      </Text>
                    </View>
                    {item.category && (
                      <View>
                        <Text className="text-muted-foreground">Category: </Text>
                        <Text data-testid={`text-item-category-${item.id}`}>{item.category}</Text>
                      </View>
                    )}
                    {item.description && (
                      <Text
                        className="text-muted-foreground text-xs mt-2"
                        data-testid={`text-item-description-${item.id}`}
                      >
                        {item.description}
                      </Text>
                    )}
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <Text className="text-lg font-medium mb-2" data-testid="text-empty-title">
                No Items Yet
              </Text>
              <Text
                className="text-sm text-muted-foreground mb-4"
                data-testid="text-empty-description"
              >
                Get started by adding your first inventory item.
              </Text>
              {canEdit && (
                <Button onPress={handleOpenDialog} data-testid="button-empty-add">
                  <Plus className="w-4 h-4 mr-2" />
                  <Text>Add Item</Text>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </View>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="dialog-item-form">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingItem ? 'Edit Item' : 'Create Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update the item details below.'
                : 'Add a new item to your inventory. SKU will be auto-generated if left empty.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <View onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Dell Laptop"
                        data-testid="input-item-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Auto-generated if empty"
                        data-testid="input-item-sku"
                      />
                    </FormControl>
                    <FormDescription>Leave empty to auto-generate</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-item-type">
                          <SelectValue placeholder="Select item type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="serialized" data-testid="option-serialized">
                          Serialized
                        </SelectItem>
                        <SelectItem value="non-serialized" data-testid="option-non-serialized">
                          Non-Serialized
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Serialized items have unique serial numbers (e.g., laptops). Non-serialized
                      items are tracked in batches (e.g., pencils).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consumptionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumption Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-consumption-type">
                          <SelectValue placeholder="Select consumption type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sellable" data-testid="option-sellable">
                          Sellable
                        </SelectItem>
                        <SelectItem value="loanable" data-testid="option-loanable">
                          Loanable
                        </SelectItem>
                        <SelectItem value="consumable" data-testid="option-consumable">
                          Consumable
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Sellable items are marked as sold when scanned. Loanable items prompt for a
                      user when scanned. Consumable items are marked out of stock when scanned.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="e.g., Electronics"
                        data-testid="input-item-category"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Item description..."
                        rows={3}
                        data-testid="input-item-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reorderLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Level</FormLabel>
                    <FormControl>
                      <Input
                        keyboardType="numeric"
                        {...field}
                        value={field.value ? String(field.value) : ''}
                        onChangeText={(text) => {
                          const val = text;
                          if (val === '') {
                            field.onChange(undefined);
                          } else {
                            const parsed = Number(val);
                            field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                          }
                        }}
                        data-testid="input-item-reorder-level"
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum stock quantity before reordering (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('type') === 'serialized' && (
                <>
                  <Separator className="my-4" />

                  <View className="space-y-3" data-testid="section-bulk-serial-creation">
                    <View className="flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      <Text className="text-sm font-medium">Bulk Serial Creation</Text>
                    </View>

                    {!editingItem ? (
                      <View className="rounded-md bg-muted p-3">
                        <Text className="text-xs text-muted-foreground">
                          Save this item first, then you can generate multiple serial numbers with
                          QR codes at once.
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text className="text-xs text-muted-foreground">
                          Generate multiple serial numbers at once for this item
                        </Text>

                        <View className="grid grid-cols-2 gap-3">
                          <View className="space-y-2">
                            <Text className="text-sm font-medium" htmlFor="bulk-quantity">
                              Quantity
                            </Text>
                            <Input
                              id="bulk-quantity"
                              keyboardType="numeric"
                              min="1"
                              max="1000"
                              placeholder="e.g., 50"
                              value={bulkSerialQuantity}
                              onChangeText={setBulkSerialQuantity}
                              data-testid="input-bulk-quantity"
                            />
                          </View>

                          <View className="space-y-2">
                            <Text className="text-sm font-medium" htmlFor="bulk-start-index">
                              Start Index
                            </Text>
                            <Input
                              id="bulk-start-index"
                              placeholder={editingItem.sku}
                              value={bulkSerialStartIndex}
                              onChangeText={setBulkSerialStartIndex}
                              onFocus={(e) => {
                                if (!e.target.value) {
                                  setBulkSerialStartIndex(editingItem.sku);
                                }
                              }}
                              data-testid="input-bulk-start-index"
                            />
                          </View>
                        </View>

                        <View className="space-y-2">
                          <Text className="text-sm font-medium" htmlFor="bulk-warehouse">
                            Warehouse
                          </Text>
                          <Select
                            value={bulkSerialWarehouse}
                            onValueChange={setBulkSerialWarehouse}
                          >
                            <SelectTrigger id="bulk-warehouse" data-testid="select-bulk-warehouse">
                              <SelectValue placeholder="Select warehouse" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses?.map((warehouse) => (
                                <SelectItem
                                  key={warehouse.id}
                                  value={warehouse.id}
                                  data-testid={`option-warehouse-${warehouse.id}`}
                                >
                                  {warehouse.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Text className="text-xs text-muted-foreground">
                            Serial numbers will be: {bulkSerialStartIndex || editingItem.sku}-0001,{' '}
                            {bulkSerialStartIndex || editingItem.sku}-0002, ...
                          </Text>
                        </View>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onPress={handleBulkSerialCreate}
                          disabled={bulkSerialMutation.isPending}
                          className="w-full"
                          data-testid="button-bulk-create-serials"
                        >
                          {bulkSerialMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              <Text>Creating...</Text>
                            </>
                          ) : (
                            <>
                              <QrCode className="w-4 h-4 mr-2" />
                              <Text>Create Serials</Text>
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </View>
                </>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onPress={() => setDialogOpen(false)}
                  data-testid="button-cancel-item"
                >
                  <Text>Cancel</Text>
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-item"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <Text>Saving...</Text>
                    </>
                  ) : editingItem ? (
                    <Text>Update</Text>
                  ) : (
                    <Text>Create</Text>
                  )}
                </Button>
              </DialogFooter>
            </View>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-confirm-delete-title">Delete Item</AlertDialogTitle>
            <AlertDialogDescription data-testid="text-confirm-delete-description">
              Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-testid="button-cancel-delete"
              onPress={() => setDeleteItem(null)}
            >
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              onPress={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <Text>Deleting...</Text>
                </>
              ) : (
                <Text>Delete</Text>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Serial Creation Success Dialog */}
      <Dialog open={!!bulkSerialResult} onOpenChange={(open) => !open && setBulkSerialResult(null)}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
          data-testid="dialog-bulk-serial-success"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-bulk-success-title">
              <QrCode className="w-5 h-5 text-primary" />
              Serial Numbers Created
            </DialogTitle>
            <DialogDescription data-testid="text-bulk-success-description">
              Successfully created {bulkSerialResult?.count} serial numbers with QR codes
            </DialogDescription>
          </DialogHeader>

          <View className="space-y-4">
            <View className="rounded-md bg-muted p-4 print:bg-white">
              <Text className="text-sm font-medium mb-4 print:hidden">QR Codes Preview:</Text>
              <View className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto print:grid-cols-4 print:max-h-none print:gap-6">
                {bulkSerialResult?.serials.map((serial) => (
                  <View
                    key={serial.id}
                    className="flex flex-col items-center gap-2 p-3 bg-background rounded print:break-inside-avoid print:bg-white print:border print:border-gray-300"
                    data-testid={`qr-code-${serial.id}`}
                  >
                    {serial.qrToken && <QRCodeSVG value={serial.qrToken} size={120} level="M" />}
                    <Text
                      className="text-xs font-mono text-center break-all"
                      data-testid={`text-serial-${serial.id}`}
                    >
                      {serial.serialNumber}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <Text className="text-xs text-muted-foreground print:hidden">
              Click "Print QR Codes" to print these QR codes. You can also view and manage these
              serial numbers in the Inventory section.
            </Text>
          </View>

          <DialogFooter className="flex gap-2 print:hidden">
            <Button
              variant="outline"
              onPress={() => setBulkSerialResult(null)}
              data-testid="button-bulk-success-close"
            >
              <Text>Close</Text>
            </Button>
            <Button onPress={handlePrintQRCodes} data-testid="button-print-qr-codes">
              <Printer className="w-4 h-4 mr-2" />
              <Text>Print QR Codes</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </View>
  );
}
