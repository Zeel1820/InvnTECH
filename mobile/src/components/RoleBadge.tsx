'use client';

import { Badge, BadgeProps } from './ui/badge';
import { Shield, UserCog, User, LucideIcon } from 'lucide-react';

interface RoleBadgeProps {
  role: 'admin' | 'manager' | 'staff';
}

const roleConfig: Record<
  RoleBadgeProps['role'],
  { label: string; icon: LucideIcon; variant: BadgeProps['variant'] }
> = {
  admin: { label: 'Admin', icon: Shield, variant: 'purple' },
  manager: { label: 'Manager', icon: UserCog, variant: 'info' },
  staff: { label: 'Staff', icon: User, variant: 'secondary' },
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className="flex items-center gap-1.5"
      data-testid={`badge-role-${role}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </Badge>
  );
}
