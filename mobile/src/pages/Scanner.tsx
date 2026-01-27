
import TopBar from "../components/TopBar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Camera, Flashlight, Upload, Keyboard, Package, Loader2, AlertCircle, User } from "lucide-react-native";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-native";
import type { Item, Serial } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { apiRequest, queryClient } from "../lib/queryClient";
import { BarCodeScanner } from 'expo-barcode-scanner';
import { View, Text, StyleSheet } from 'react-native';

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
  const [manualEntry, setManualEntry] = useState("");
  const [scanMode, setScanMode] = useState<"camera" | "manual">("manual");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [lookupCode, setLookupCode] = useState<string | null>(null);
  const [pendingConsumption, setPendingConsumption] = useState<{ item: Item; code: string } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const { data: lookupResult, isLoading: isLookingUp, error: lookupError } = useQuery<LookupResult>({
    queryKey: ['/api/lookup', lookupCode],
    enabled: !!lookupCode,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const consumeMutation = useMutation({
    mutationFn: async (data: { code: string; action: string; assignedToId?: string }) => {
      const res = await apiRequest("POST", "/api/consume", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/serials'] });
      toast({
        title: "Success",
        description: data.message,
      });
      setPendingConsumption(null);
      setSelectedUserId("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (lookupResult && lookupCode) {
      const item = lookupResult.item;
      if (!item) {
        setLookupCode(null);
        return;
      }
      setPendingConsumption({ item, code: lookupCode });
      setLookupCode(null);
    }
  }, [lookupResult, lookupCode]);

  useEffect(() => {
    if (lookupError) {
      toast({
        title: "Not Found",
        description: "No item or serial number matches this code",
        variant: "destructive",
      });
      setLookupCode(null);
    }
  }, [lookupError, toast]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setLookupCode(data);
    setScanMode('manual');
  };

  const handleManualSubmit = () => {
    if (manualEntry.trim()) {
      setLookupCode(manualEntry.trim());
      setManualEntry("");
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={{flex: 1, paddingBottom: 16}}>
      <TopBar
        title="QR Scanner"
        showBack={true}
        onBackClick={() => navigate('/dashboard')}
      />

      <View style={{paddingHorizontal: 16, paddingTop: 16, flex: 1}}>
        {isLookingUp && (
          <Card>
            <CardContent style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 32}}>
              <Loader2 width={32} height={32} className="animate-spin text-primary" />
              <Text style={{marginLeft: 12}}>Looking up...</Text>
            </CardContent>
          </Card>
        )}

        {scanMode === "camera" ? (
          <View style={{flex: 1}}>
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
            {scanned && <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />}
          </View>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Keyboard width={20} height={20} />
                <Text>Manual Entry</Text>
              </CardTitle>
            </CardHeader>
            <CardContent style={{gap: 16}}>
              <View>
                <Text style={{marginBottom: 8}}>Enter SKU or Serial Number</Text>
                <Input
                  placeholder="e.g., LAP-001-0001 or LAPTOP-SKU"
                  value={manualEntry}
                  onChangeText={setManualEntry}
                  onSubmitEditing={handleManualSubmit}
                  autoFocus
                />
              </View>
              <Button
                onPress={handleManualSubmit}
                disabled={!manualEntry.trim() || isLookingUp}
              >
                {isLookingUp ? (
                  <>
                    <Loader2 width={16} height={16} style={{marginRight: 8}} className="animate-spin" />
                    <Text>Looking up...</Text>
                  </>
                ) : (
                  <>
                    <Package width={16} height={16} style={{marginRight: 8}} />
                    <Text>Look Up</Text>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <Button
          variant="outline"
          onPress={() => {
            setScanned(false);
            setScanMode(scanMode === "camera" ? "manual" : "camera");
          }}
        >
          <Keyboard width={20} height={20} style={{marginRight: 8}} />
          <Text>{scanMode === "camera" ? "Switch to Manual Entry" : "Switch to Camera Scan"}</Text>
        </Button>

        <Card>
          <CardContent style={{paddingTop: 24}}>
            <Text style={{fontWeight: '500', marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <AlertCircle width={16} height={16} />
              Instructions
            </Text>
            <View style={{gap: 4, paddingLeft: 16}}>
              {scanMode === 'camera' ? (
                <>
                  <Text>Point camera at QR code and hold steady</Text>
                  <Text>Scanner will automatically detect and lookup the item</Text>
                </>
              ) : (
                <>
                  <Text>Enter the exact SKU or serial number</Text>
                  <Text>Press Enter or click "Look Up" to search</Text>
                </>
              )}
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  );
}
