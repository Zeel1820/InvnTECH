'use client';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import RoleBadge from './RoleBadge';
import { Button } from './ui/button';
import { Mail, Phone } from 'lucide-react';

interface UserDetailsProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'staff';
    avatarUrl?: string;
    phone?: string;
    team?: string;
    lastActive?: string;
  };
  onEdit?: (id: string) => void;
}

export default function UserDetails({ user, onEdit }: UserDetailsProps) {
  return (
    <div className="bg-card p-6 rounded-lg border w-full max-w-sm">
      <div className="flex flex-col items-center text-center">
        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-semibold">{user.name}</h2>
        <p className="text-muted-foreground">{user.email}</p>
        <div className="mt-2">
          <RoleBadge role={user.role} />
        </div>
      </div>

      <div className="mt-6 space-y-4 text-sm">
        {user.phone && (
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{user.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{user.email}</span>
        </div>
        {user.team && (
          <div className="flex items-center gap-3">
            <span className="font-medium">Team:</span>
            <span className="text-muted-foreground">{user.team}</span>
          </div>
        )}
        {user.lastActive && (
          <div className="flex items-center gap-3">
            <span className="font-medium">Last Active:</span>
            <span className="text-muted-foreground">{user.lastActive}</span>
          </div>
        )}
      </div>

      {onEdit && (
        <Button
          variant="outline"
          className="w-full mt-6"
          onClick={() => onEdit(user.id)}
        >
          Edit Profile
        </Button>
      )}
    </div>
  );
}
