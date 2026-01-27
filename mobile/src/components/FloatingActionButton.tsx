'use client';

import { Button } from './ui/button';
import { LucideIcon, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface FloatingActionButtonProps {
  icon?: LucideIcon;
  onClick?: () => void;
  label?: string;
  className?: string;
}

export default function FloatingActionButton({
  icon: Icon = Plus,
  onClick,
  label = 'Add',
  className,
}: FloatingActionButtonProps) {
  return (
    <Button
      size="lg"
      className={cn(
        'fixed bottom-20 right-4 z-40 h-14 rounded-full shadow-lg px-5 flex items-center',
        className
      )}
      onClick={onClick}
      data-testid="button-fab"
    >
      <Icon className="w-6 h-6 mr-2" />
      {label}
    </Button>
  );
}
