'use client';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import RoleBadge from './RoleBadge';
import { ChevronRight } from 'lucide-react';

interface UserListItemProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'staff';
    avatarUrl?: string;
  };
  onClick?: (id: string) => void;
}

export default function UserListItem({ user, onClick }: UserListItemProps) {
  return (
    <div
      className="flex items-center gap-4 p-4 bg-card border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onClick?.(user.id)}
      data-testid={`item-user-${user.id}`}
    >
      <Avatar>
        <AvatarImage src={user.avatarUrl} alt={user.name} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.name}</p>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
      </div>

      <div className="flex items-center gap-2">
        <RoleBadge role={user.role} />
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  );
}
