
import { Home, Package, QrCode, BarChart3 } from "lucide-react";
import { Link, useLocation } from "react-router-native";
import { View, Pressable, Text } from 'react-native';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Package, label: "Inventory", path: "/inventory" },
  { icon: QrCode, label: "Scan", path: "/scan" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <View style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#e5e7eb' }}>
      <View style={{ flexDirection: 'row', height: 56 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`link-nav-${item.label.toLowerCase()}`}
              style={{ flex: 1 }}
            >
              <Pressable
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  backgroundColor: isActive ? '#f3f4f6' : 'transparent'
                }}
                data-testid={`button-nav-${item.label.toLowerCase()}`}
              >
                <Icon style={{ width: 20, height: 20, color: isActive ? '#6366f1' : '#6b7280' }} />
                <Text style={{ fontSize: 12, fontWeight: '500', color: isActive ? '#6366f1' : '#6b7280' }}>{item.label}</Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}
