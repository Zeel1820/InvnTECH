import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '../lib/queryClient';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertWarehouseSchema, type Warehouse } from '../../../shared/schema';
import { Plus, MapPin, Edit, Trash2, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import type { z } from 'zod';
import { View, Text, ScrollView } from 'react-native';

type WarehouseFormData = z.infer<typeof insertWarehouseSchema>;

export default function Warehouses() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteWarehouse, setDeleteWarehouse] = useState<Warehouse | null>(null);

  const {
    data: warehouses,
    isLoading,
    error,
  } = useQuery<Warehouse[]>({
    queryKey: ['/api/warehouses'],
  });

  const isAdmin = user?.role === 'admin';

  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(insertWarehouseSchema),
    defaultValues: {
      name: '',
      location: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: WarehouseFormData) => {
      const res = await apiRequest('POST', '/api/warehouses', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Warehouse created successfully',
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<WarehouseFormData> }) => {
      const res = await apiRequest('PATCH', `/api/warehouses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      setDialogOpen(false);
      setEditingWarehouse(null);
      form.reset();
      toast({
        title: 'Success',
        description: 'Warehouse updated successfully',
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
      const res = await apiRequest('DELETE', `/api/warehouses/${id}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      setDeleteWarehouse(null);
      toast({
        title: 'Success',
        description: 'Warehouse deleted successfully',
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

  const handleSubmit = (data: WarehouseFormData) => {
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    form.reset({
      name: warehouse.name,
      location: warehouse.location || '',
    });
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingWarehouse(null);
    form.reset({
      name: '',
      location: '',
    });
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading warehouses...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <Text className="text-destructive text-center font-medium mb-2">
              Failed to load warehouses
            </Text>
            <Text className="text-sm text-muted-foreground text-center">{(error as Error).message}</Text>
          </CardContent>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView className="min-h-screen bg-background">
      <View className="px-4 py-6">
        <View className="flex justify-between items-center mb-6">
          <View>
            <Text className="text-2xl font-medium">Warehouses</Text>
            <Text className="text-sm text-muted-foreground mt-1">
              Manage warehouse locations and assignments
            </Text>
          </View>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onPress={handleAddNew} data-testid="button-add-warehouse">
                  <Plus className="w-4 h-4 mr-2" />
                  <Text>Add Warehouse</Text>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <View onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Main Warehouse"
                              data-testid="input-warehouse-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ''}
                              placeholder="123 Main St, City, State"
                              data-testid="input-warehouse-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <View className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onPress={() => {
                          setDialogOpen(false);
                          setEditingWarehouse(null);
                          form.reset();
                        }}
                        data-testid="button-cancel"
                      >
                        <Text>Cancel</Text>
                      </Button>
                      <Button
                        onPress={form.handleSubmit(handleSubmit)}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="button-submit-warehouse"
                      >
                        <Text>
                          {createMutation.isPending || updateMutation.isPending
                            ? 'Saving...'
                            : editingWarehouse
                            ? 'Update'
                            : 'Create'}
                        </Text>
                      </Button>
                    </View>
                  </View>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </View>

        <AlertDialog open={!!deleteWarehouse} onOpenChange={() => setDeleteWarehouse(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteWarehouse?.name}"? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete"><Text>Cancel</Text></AlertDialogCancel>
              <AlertDialogAction
                onPress={() => deleteWarehouse && deleteMutation.mutate(deleteWarehouse.id)}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete"
              >
                <Text>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</Text>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {warehouses && warehouses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
              <Text className="text-muted-foreground text-center">
                No warehouses found. Add your first warehouse to get started.
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {warehouses?.map((warehouse) => (
              <Card key={warehouse.id} data-testid={`card-warehouse-${warehouse.id}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle
                    className="text-lg font-medium"
                    data-testid={`text-warehouse-name-${warehouse.id}`}
                  >
                    {warehouse.name}
                  </CardTitle>
                  {isAdmin && (
                    <View className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onPress={() => handleEdit(warehouse)}
                        data-testid={`button-edit-warehouse-${warehouse.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onPress={() => setDeleteWarehouse(warehouse)}
                        data-testid={`button-delete-warehouse-${warehouse.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </View>
                  )}
                </CardHeader>
                <CardContent>
                  {warehouse.location && (
                    <View className="flex items-start gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <Text
                        className="text-sm text-muted-foreground"
                        data-testid={`text-warehouse-location-${warehouse.id}`}
                      >
                        {warehouse.location}
                      </Text>
                    </View>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
