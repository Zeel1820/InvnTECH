import { Menu, Search, Bell, ChevronLeft } from 'lucide-react-native';
import { Button } from './ui/button';
import { View, Text } from 'react-native';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  onBackClick?: () => void;
  onMenuClick?: () => void;
  showSearch?: boolean;
  onSearchClick?: () => void;
  showNotifications?: boolean;
}

export default function TopBar({
  title,
  showBack = false,
  onBackClick,
  onMenuClick,
  showSearch = false,
  onSearchClick,
  showNotifications = false,
}: TopBarProps) {
  return (
    <View className="bg-background border-b border-border">
      <View className="flex-row items-center justify-between h-14 px-4">
        <View className="flex-row items-center gap-2">
          {showBack ? (
            <Button size="icon" variant="ghost" onPress={onBackClick} data-testid="button-back">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" onPress={onMenuClick} data-testid="button-menu">
              <Menu className="w-5 h-5 text-foreground" />
            </Button>
          )}
          <Text className="text-lg font-medium text-foreground truncate">{title}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          {showSearch && (
            <Button size="icon" variant="ghost" onPress={onSearchClick} data-testid="button-search">
              <Search className="w-5 h-5 text-foreground" />
            </Button>
          )}
          {showNotifications && (
            <Button size="icon" variant="ghost" data-testid="button-notifications">
              <Bell className="w-5 h-5 text-foreground" />
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}
