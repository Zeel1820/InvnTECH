// Reference: blueprint:javascript_log_in_with_replit
import { Button } from "@/components/ui/button";
import { Package, QrCode, BarChart3, Warehouse } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            InvenTECH
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Enterprise Inventory Management System
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Track serialized and non-serialized inventory across multiple warehouses 
            with QR code scanning, immutable audit trails, and comprehensive reporting.
          </p>
          <Button 
            size="lg" 
            className="h-12 px-8 text-lg"
            onClick={handleLogin}
            data-testid="button-login"
          >
            Sign In to Continue
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-card border border-card-border rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">Inventory Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Manage both serialized items and batch inventory with comprehensive lifecycle tracking
            </p>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">QR Code System</h3>
            <p className="text-sm text-muted-foreground">
              Generate and scan QR codes with JWT security for instant item lookup and verification
            </p>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Warehouse className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">Multi-Warehouse</h3>
            <p className="text-sm text-muted-foreground">
              Manage inventory across multiple warehouses with role-based access control
            </p>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">Advanced Reports</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive reporting with stock ledger, low stock alerts, and utilization analytics
            </p>
          </div>
        </div>

        <div className="mt-16 max-w-4xl mx-auto bg-card border border-card-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">For Admins</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Full system access and configuration</li>
                <li>• User and warehouse management</li>
                <li>• Comprehensive audit trails</li>
                <li>• Advanced reporting and analytics</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">For Managers</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Assigned warehouse management</li>
                <li>• Stock transfers and approvals</li>
                <li>• Inventory adjustments</li>
                <li>• Team activity monitoring</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">For Staff</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• QR code scanning</li>
                <li>• Item lookup and verification</li>
                <li>• Stock issue and return</li>
                <li>• Mobile-optimized interface</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Technical Features</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Immutable ledger system</li>
                <li>• FIFO/LIFO batch tracking</li>
                <li>• Expiry date management</li>
                <li>• Offline-first architecture</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
