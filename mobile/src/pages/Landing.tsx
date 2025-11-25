// Reference: blueprint:javascript_log_in_with_replit
import { Button } from '../components/ui/button';
import { Package, QrCode, BarChart3, Warehouse } from 'lucide-react-native';
import { View, Text, ScrollView } from 'react-native';
import { useNavigate } from 'react-router-native';

export default function Landing() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <ScrollView className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <View className="px-4 py-16">
        <View className="items-center mb-16">
          <Text className="text-4xl font-bold mb-4 text-center">InvenTECH</Text>
          <Text className="text-xl text-muted-foreground mb-8 text-center">
            Enterprise Inventory Management System
          </Text>
          <Text className="text-lg text-muted-foreground max-w-2xl mb-8 text-center">
            Track serialized and non-serialized inventory across multiple warehouses with QR code
            scanning, immutable audit trails, and comprehensive reporting.
          </Text>
          <Button
            size="lg"
            className="h-12 px-8 text-lg mb-4"
            onPress={handleLogin}
            data-testid="button-login"
          >
            <Text>Sign In to Continue</Text>
          </Button>

          <Button onPress={handleSignup}><Text>Create Account</Text></Button>
        </View>

        <View className="flex-col gap-6">
          <View className="bg-card border border-card-border rounded-lg p-6 items-center">
            <View className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-primary" />
            </View>
            <Text className="font-medium mb-2 text-center">Inventory Tracking</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Manage both serialized items and batch inventory with comprehensive lifecycle tracking
            </Text>
          </View>

          <View className="bg-card border border-card-border rounded-lg p-6 items-center">
            <View className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6 text-primary" />
            </View>
            <Text className="font-medium mb-2 text-center">QR Code System</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Generate and scan QR codes with JWT security for instant item lookup and verification
            </Text>
          </View>

          <View className="bg-card border border-card-border rounded-lg p-6 items-center">
            <View className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Warehouse className="w-6 h-6 text-primary" />
            </View>
            <Text className="font-medium mb-2 text-center">Multi-Warehouse</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Manage inventory across multiple warehouses with role-based access control
            </Text>
          </View>

          <View className="bg-card border border-card-border rounded-lg p-6 items-center">
            <View className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </View>
            <Text className="font-medium mb-2 text-center">Advanced Reports</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Comprehensive reporting with stock ledger, low stock alerts, and utilization analytics
            </Text>
          </View>
        </View>

        <View className="mt-16 bg-card border border-card-border rounded-lg p-8">
          <Text className="text-2xl font-bold mb-6 text-center">Key Features</Text>
          <View className="flex-col gap-6">
            <View>
              <Text className="font-medium mb-2">For Admins</Text>
              <View className="text-sm text-muted-foreground space-y-1">
                <Text>• Full system access and configuration</Text>
                <Text>• User and warehouse management</Text>
                <Text>• Comprehensive audit trails</Text>
                <Text>• Advanced reporting and analytics</Text>
              </View>
            </View>
            <View>
              <Text className="font-medium mb-2">For Managers</Text>
              <View className="text-sm text-muted-foreground space-y-1">
                <Text>• Assigned warehouse management</Text>
                <Text>• Stock transfers and approvals</Text>
                <Text>• Inventory adjustments</Text>
                <Text>• Team activity monitoring</Text>
              </View>
            </View>
            <View>
              <Text className="font-medium mb-2">For Staff</Text>
              <View className="text-sm text-muted-foreground space-y-1">
                <Text>• QR code scanning</Text>
                <Text>• Item lookup and verification</Text>
                <Text>• Stock issue and return</Text>
                <Text>• Mobile-optimized interface</Text>
              </View>
            </View>
            <View>
              <Text className="font-medium mb-2">Technical Features</Text>
              <View className="text-sm text-muted-foreground space-y-1">
                <Text>• Immutable ledger system</Text>
                <Text>• FIFO/LIFO batch tracking</Text>
                <Text>• Expiry date management</Text>
                <Text>• Offline-first architecture</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
