import { Home, Package, QrCode, BarChart3 } from 'lucide-react-native';
import { Link, useLocation } from 'react-router-native';
import { View, Text } from 'react-native';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: QrCode, label: 'Scan', path: '/scan' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <View className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <View className="flex-row h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`link-nav-${item.label.toLowerCase()}`}
              className="flex-1 items-center justify-center gap-1"
              underlayColor="#f3f4f6"
            >
              <View
                className={`flex-1 items-center justify-center gap-1 ${
                  isActive ? 'bg-gray-100' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-500' : 'text-gray-500'}`} />
                <Text
                  className={`text-xs font-medium ${
                    isActive ? 'text-indigo-500' : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </Text>
              </View>
            </Link>
          );
        })}
      </View>
    </View>
  );
}
