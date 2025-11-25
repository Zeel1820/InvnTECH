import { LucideIcon, Package } from "lucide-react-native";
import { Button } from "./ui/button";
import { View, Text } from 'react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon = Package,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-12 px-4 text-center">
      <View className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </View>
      
      <Text className="text-lg font-medium mb-2" data-testid="text-empty-title">{title}</Text>
      
      {description && (
        <Text className="text-sm text-muted-foreground max-w-sm mb-6 text-center" data-testid="text-empty-description">
          {description}
        </Text>
      )}
      
      {actionLabel && onAction && (
        <Button onPress={onAction} data-testid="button-empty-action">
          <Text>{actionLabel}</Text>
        </Button>
      )}
    </View>
  );
}
