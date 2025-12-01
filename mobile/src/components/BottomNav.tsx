
import { Home, Package, BarChart3, QrCode } from 'lucide-react-native';
import { Link, useLocation } from 'react-router-native';
import { cn } from '../lib/utils';
import { Text, View } from 'react-native';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: QrCode, label: 'Scan', path: '/scan' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e5e5e5' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', height: 64 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, }}
            >
              <>
              <Icon
                className={cn(
                  'w-6 h-6',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <Text
                className={cn(
                  'mt-1',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Text>
              </>
            </Link>
          );
        })}
      </View>
    </View>
  );
}
