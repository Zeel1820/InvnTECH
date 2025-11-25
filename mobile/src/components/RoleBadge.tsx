import { Badge } from "./ui/badge";
import { Shield, UserCog, User } from "lucide-react-native";
import { Text } from 'react-native';

interface RoleBadgeProps {
  role: "admin" | "manager" | "staff";
}

const roleConfig = {
  admin: {
    label: "Admin",
    icon: Shield,
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  },
  manager: {
    label: "Manager",
    icon: UserCog,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  staff: {
    label: "Staff",
    icon: User,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  },
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge className={`flex-row items-center gap-1 ${config.className}`} data-testid={`badge-role-${role}`}>
      <Icon className="w-3 h-3" />
      <Text>{config.label}</Text>
    </Badge>
  );
}
