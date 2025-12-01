'use client';

import { Home, Package, BarChart3, QrCode } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { cn } from '../lib/utils';

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
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors"
            >
              <Icon
                className={cn(
                  'w-6 h-6',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'mt-1',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
