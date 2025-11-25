// Reference: blueprint:javascript_log_in_with_replit
import { useQuery } from '@tanstack/react-query';
// Update the import path to the correct location of the User type
import type { User } from '../../../shared/schema';

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isStaff: user?.role === 'staff',
  };
}
