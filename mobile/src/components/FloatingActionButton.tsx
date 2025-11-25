import { Button } from "./ui/button";
import { LucideIcon, Plus } from "lucide-react";

interface FloatingActionButtonProps {
  icon?: LucideIcon;
  onClick?: () => void;
  label?: string;
}

export default function FloatingActionButton({
  icon: Icon = Plus,
  onClick,
  label = "Add",
}: FloatingActionButtonProps) {
  return (
    <Button
      size="default"
      className="fixed bottom-20 right-4 z-40 h-14 rounded-full shadow-lg px-6"
      onClick={onClick}
      data-testid="button-fab"
    >
      <Icon className="w-5 h-5 mr-2" />
      {label}
    </Button>
  );
}
