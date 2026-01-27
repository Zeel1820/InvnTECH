'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '../lib/queryClient';
import type { User } from '../../../shared/schema';

// This auth hook assumes http-only cookies for session management.
// The server is expected to set a cookie on login and clear it on logout.

export function useAuth() {
  const queryClient = useQueryClient();

  // Query for the current user.
  const { data: user, isLoading, isFetching, isError } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }), // Return null if not authenticated
    retry: false, // Don't retry on error (like 401)
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch on window focus
  });

  // Login mutation
  const { mutateAsync: login, isLoading: isLoggingIn } = useMutation({
    mutationFn: async (credentials: { email: string; password: string; remember?: boolean }) => {
      const res = await apiRequest('POST', '/api/auth/login', credentials);
      return (await res.json()) as { user: User };
    },
    onSuccess: (data) => {
      // On successful login, server sets a session cookie.
      // Update the user in the cache for a fast UI update.
      queryClient.setQueryData(['/api/auth/user'], data.user);
    },
    // Let the component handle onError.
  });

  // Logout mutation
  const { mutateAsync: logout, isLoading: isLoggingOut } = useMutation({
    mutationFn: () => apiRequest('POST', '/api/auth/logout'),
    onSuccess: () => {
      // After logout, the session is gone.
      // Clear the user data from the cache.
      queryClient.setQueryData(['/api/auth/user'], null);
      // Can also clear the entire query cache for a "hard reset"
      // queryClient.clear();
    },
  });
  
  // `isError` will be true if the query fails for reasons other than 401.
  // We can consider the user not authenticated if there's an error.
  const isAuthenticated = !isError && !!user;

  return {
    user,
    isLoading: isLoading || isFetching,
    isLoggingIn,
    isLoggingOut,
    login,
    logout,
    isAuthenticated,
    isAdmin: isAuthenticated && user?.role === 'admin',
    isManager: isAuthenticated && user?.role === 'manager',
    isStaff: isAuthenticated && user?.role === 'staff',
  };
}
