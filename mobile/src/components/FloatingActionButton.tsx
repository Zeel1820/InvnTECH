import { Button } from "./ui/button";
import { LucideIcon, Plus } from "lucide-react-native";
import { Text } from 'react-native';

interface FloatingActionButtonProps {
  icon?: LucideIcon;
  onPress?: () => void;
  label?: string;
}

export default function FloatingActionButton({
  icon: Icon = Plus,
  onPress,
  label = "Add",
}: FloatingActionButtonProps) {
  return (
    <Button
      size="default"
      className="absolute bottom-20 right-4 z-40 h-14 rounded-full shadow-lg px-6 flex-row items-center"
      onPress={onPress}
      data-testid="button-fab"
    >
      <Icon className="w-5 h-5 mr-2" />
      <Text>{label}</Text>
    </Button>
  );
}
