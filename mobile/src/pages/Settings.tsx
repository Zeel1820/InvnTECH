import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Bell, User, Palette, ChevronRight, LogOut, ArrowRightLeft, Warehouse } from "lucide-react";
import { Switch } from "../components/ui/switch";
import { useAuth } from "../hooks/useAuth";

export default function Settings() {
  const { user, logout } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="min-h-screen bg-background pb-16">
      <TopBar title="Settings" onMenuClick={() => console.log("Menu clicked")} />

      <main className="px-4 pt-4 space-y-6">
        {/* Profile Section */}
        <Card data-testid="card-profile">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg" data-testid="text-user-name">
                {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
              </CardTitle>
              <CardDescription data-testid="text-user-email">
                {user?.email}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* General Settings */}
        <Card data-testid="card-general-settings">
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between py-2" data-testid="setting-notifications">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Push Notifications</span>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2" data-testid="setting-theme">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Dark Mode</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Management Section */}
        {canManage && (
          <Card data-testid="card-management-settings">
            <CardHeader>
              <CardTitle className="text-base">Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-4 text-base"
                onClick={() => window.location.href = '/warehouses'}
                data-testid="button-manage-warehouses"
              >
                <Warehouse className="w-5 h-5 mr-3" />
                Manage Warehouses
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-4 text-base"
                onClick={() => window.location.href = '/transfers'}
                data-testid="button-manage-transfers"
              >
                <ArrowRightLeft className="w-5 h-5 mr-3" />
                Manage Transfers
              </Button>
              {user?.role === 'admin' && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3 py-4 text-base"
                    onClick={() => window.location.href = '/users'}
                    data-testid="button-manage-users"
                  >
                    <User className="w-5 h-5 mr-3" />
                    Manage Users
                  </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full text-base py-6"
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
