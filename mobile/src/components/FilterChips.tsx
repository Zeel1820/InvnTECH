import { Badge } from "./ui/badge";
import { X } from "lucide-react-native";
import { View, Pressable, Text } from 'react-native';

interface FilterChip {
  id: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  filters: FilterChip[];
  onRemove?: (id: string) => void;
}

export default function FilterChips({ filters, onRemove }: FilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <View className="flex flex-row flex-wrap gap-2">
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="flex-row items-center gap-1 pl-3 pr-2 py-1.5"
          data-testid={`badge-filter-${filter.id}`}
        >
          <Text className="text-xs">{filter.label}: {filter.value}</Text>
          {onRemove && (
            <Pressable
              onPress={() => onRemove(filter.id)}
              className="ml-1 rounded-full p-1"
              data-testid={`button-remove-filter-${filter.id}`}
            >
              <X className="w-3 h-3" />
            </Pressable>
          )}
        </Badge>
      ))}
    </View>
  );
}
