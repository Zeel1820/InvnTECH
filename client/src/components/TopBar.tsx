import { Menu, Search, Bell, ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";

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
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {showBack ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={onBackClick}
              data-testid="button-back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              onClick={onMenuClick}
              data-testid="button-menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-lg font-medium truncate">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {showSearch && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onSearchClick}
              data-testid="button-search"
            >
              <Search className="w-5 h-5" />
            </Button>
          )}
          {showNotifications && (
            <Button
              size="icon"
              variant="ghost"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
