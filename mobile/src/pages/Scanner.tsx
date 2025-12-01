import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Camera,
  Flashlight,
  Upload,
  Keyboard,
  Package,
  Loader2,
  AlertCircle,
  User,
} from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Html5Qrcode } from 'html5-qrcode';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-native';
import type { Item, Serial } from '../../../shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { apiRequest, queryClient } from '../lib/queryClient';
import { View, Text } from 'react-native';

interface LookupResult {
  type: 'serial' | 'item';
  serial?: Serial;
  item?: Item;
  serials?: Serial[];
  batches?: any[];
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function Scanner() {
  const [manualEntry, setManualEntry] = useState('');
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [scanning, setScanning] = useState(false);
  const [lookupCode, setLookupCode] = useState<string | null>(null);
  const [pendingConsumption, setPendingConsumption] = useState<{ item: Item; code: string } | null>(
    null,
  );
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  const {
    data: lookupResult,
    isLoading: isLookingUp,
    error: lookupError,
  } = useQuery<LookupResult>({
    queryKey: ['/api/lookup', lookupCode],
    enabled: !!lookupCode,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && scanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, [scanning]);

  const consumeMutation = useMutation({
    mutationFn: async (data: { code: string; action: string; assignedToId?: string }) => {
      const res = await apiRequest('POST', '/api/consume', data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/serials'] });
      toast({
        title: 'Success',
        description: data.message,
      });
      setPendingConsumption(null);
      setSelectedUserId('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle lookup results - show details first, don't auto-consume
  useEffect(() => {
    if (lookupResult && lookupCode) {
      const item = lookupResult.item;
      if (!item) {
        setLookupCode(null);
        return;
      }

      // Always show details first before any action
      setPendingConsumption({ item, code: lookupCode });
      setLookupCode(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupResult, lookupCode]);

  useEffect(() => {
    if (lookupError) {
      toast({
        title: 'Not Found',
        description: 'No item or serial number matches this code',
        variant: 'destructive',
      });
      setLookupCode(null);
    }
  }, [lookupError, toast]);

  const startCameraScanning = async () => {
    if (!scannerRef.current) return;

    try {
      setScanning(true);
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Successfully scanned
          console.log('Scanned QR code:', decodedText);
          setLookupCode(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Scanning error (can be ignored - happens frequently)
        },
      );
    } catch (err) {
      console.error('Error starting camera:', err);
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive',
      });
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualEntry.trim()) {
      setLookupCode(manualEntry.trim());
      setManualEntry('');
    }
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && html5QrCodeRef.current) {
        try {
          const result = await html5QrCodeRef.current.scanFile(file, false);
          setLookupCode(result);
        } catch (err) {
          toast({
            title: 'Scan Failed',
            description: 'No QR code found in image',
            variant: 'destructive',
          });
        }
      }
    };
    input.click();
  };

  const handleLoanAssignment = () => {
    if (!pendingConsumption || !selectedUserId) return;
    consumeMutation.mutate({
      code: pendingConsumption.code,
      action: 'loan',
      assignedToId: selectedUserId,
    });
  };

  return (
    <View className="min-h-screen bg-background pb-16">
      <TopBar title="QR Scanner" showBack={true} onBackClick={() => navigate('/dashboard')} />

      <View className="px-4 pt-4 space-y-6">
        {/* Loading State */}
        {isLookingUp && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <Text className="ml-3 text-sm">Looking up...</Text>
            </CardContent>
          </Card>
        )}

        {scanMode === 'camera' ? (
          <>
            {/* Camera Viewfinder */}
            <Card className="overflow-hidden">
              <View className="relative aspect-square bg-muted">
                <View id="qr-reader" ref={scannerRef} className="w-full h-full" />
                {!scanning && (
                  <View className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Camera className="w-24 h-24 text-muted-foreground" />
                  </View>
                )}
              </View>
            </Card>

            {/* Camera Controls */}
            <View className="grid grid-cols-2 gap-4">
              {scanning ? (
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={stopScanning}
                  className="col-span-2"
                  data-testid="button-stop-scan"
                >
                  Stop Scanning
                </Button>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={startCameraScanning}
                    data-testid="button-start-scan"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Start Scan
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleFileUpload}
                    data-testid="button-upload"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload
                  </Button>
                </>
              )}
            </View>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Manual Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="text-sm font-medium mb-2 block">Enter SKU or Serial Number</Text>
                <Input
                  type="text"
                  placeholder="e.g., LAP-001-0001 or LAPTOP-SKU"
                  value={manualEntry}
                  onChangeText={setManualEntry}
                  onSubmitEditing={handleManualSubmit}
                  data-testid="input-manual-entry"
                  autoFocus
                />
              </View>
              <Button
                size="lg"
                className="w-full"
                onClick={handleManualSubmit}
                disabled={!manualEntry.trim() || isLookingUp}
                data-testid="button-lookup"
              >
                {isLookingUp ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <Text>Looking up...</Text>
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    <Text>Look Up</Text>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Toggle Mode */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            if (scanning) stopScanning();
            setScanMode(scanMode === 'camera' ? 'manual' : 'camera');
          }}
          data-testid="button-toggle-mode"
        >
          <Keyboard className="w-5 h-5 mr-2" />
          <Text>{scanMode === 'camera' ? 'Switch to Manual Entry' : 'Switch to Camera Scan'}</Text>
        </Button>

        {/* Instructions */}
        <Card>
          <CardContent className="pt-6">
            <Text className="font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Instructions
            </Text>
            <View className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {scanMode === 'camera' ? (
                <>
                  <Text>
                    <li>Click "Start Scan" to activate the camera</li>
                  </Text>
                  <Text>
                    <li>Point camera at QR code and hold steady</li>
                  </Text>
                  <Text>
                    <li>Scanner will automatically detect and lookup the item</li>
                  </Text>
                  <Text>
                    <li>Upload an image if you have a QR code screenshot</li>
                  </Text>
                </>
              ) : (
                <>
                  <Text>
                    <li>Enter the exact SKU or serial number</li>
                  </Text>
                  <Text>
                    <li>Serial numbers are usually formatted like: SKU-0001</li>
                  </Text>
                  <Text>
                    <li>Press Enter or click "Look Up" to search</li>
                  </Text>
                  <Text>
                    <li>Results will appear automatically if found</li>
                  </Text>
                </>
              )}
            </View>
          </CardContent>
        </Card>
      </View>

      <BottomNav />

      {/* Item Details and Action Dialog */}
      <Dialog
        open={!!pendingConsumption}
        onOpenChange={(open) => !open && setPendingConsumption(null)}
      >
        <DialogContent data-testid="dialog-item-details">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
            <DialogDescription>Review the item details before proceeding</DialogDescription>
          </DialogHeader>

          <View className="space-y-4 py-4">
            <View className="space-y-2">
              <View className="flex justify-between">
                <Text className="text-sm font-medium">Name:</Text>
                <Text className="text-sm">{pendingConsumption?.item.name}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-sm font-medium">SKU:</Text>
                <Text className="text-sm font-mono">{pendingConsumption?.item.sku}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-sm font-medium">Type:</Text>
                <Text className="text-sm capitalize">{pendingConsumption?.item.type}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-sm font-medium">Action:</Text>
                <Text className="text-sm font-semibold capitalize">
                  {pendingConsumption?.item.consumptionType === 'sellable'
                    ? 'Sell'
                    : pendingConsumption?.item.consumptionType === 'loanable'
                    ? 'Loan'
                    : 'Consume'}
                </Text>
              </View>
            </View>

            {/* Show user selector only for loanable items */}
            {pendingConsumption?.item.consumptionType === 'loanable' && (
              <View>
                <Text className="text-sm font-medium mb-2 block">Assign To</Text>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger data-testid="select-loan-user">
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem
                        key={user.id}
                        value={user.id}
                        data-testid={`option-user-${user.id}`}
                      >
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </View>
            )}
          </View>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPendingConsumption(null);
                setSelectedUserId('');
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!pendingConsumption) return;
                const action =
                  pendingConsumption.item.consumptionType === 'sellable'
                    ? 'sell'
                    : pendingConsumption.item.consumptionType === 'loanable'
                    ? 'loan'
                    : 'consume';

                if (action === 'loan' && !selectedUserId) {
                  toast({
                    title: 'Error',
                    description: 'Please select a user to assign this item to',
                    variant: 'destructive',
                  });
                  return;
                }

                consumeMutation.mutate({
                  code: pendingConsumption.code,
                  action,
                  assignedToId: action === 'loan' ? selectedUserId : undefined,
                });
              }}
              disabled={
                consumeMutation.isPending ||
                (pendingConsumption?.item.consumptionType === 'loanable' && !selectedUserId)
              }
              data-testid="button-confirm-action"
            >
              {consumeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <Text>Processing...</Text>
                </>
              ) : pendingConsumption?.item.consumptionType === 'sellable' ? (
                <Text>Confirm Sale</Text>
              ) : pendingConsumption?.item.consumptionType === 'loanable' ? (
                <Text>Confirm Loan</Text>
              ) : (
                <Text>Confirm Consumption</Text>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}
