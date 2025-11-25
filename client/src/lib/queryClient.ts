import { QueryClient, QueryFunction } from '@tanstack/react-query';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/* ---------------------------
   JWT-only API REQUEST
---------------------------- */
export async function apiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    ...(data ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

/* ---------------------------
   Query Function (GET calls)
---------------------------- */
export const getQueryFn =
  ({ on401 }: { on401: 'returnNull' | 'throw' }): QueryFunction =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('token');

    const res = await fetch(queryKey.join('/') as string, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (on401 === 'returnNull' && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return res.json();
  };

/* ---------------------------
   React Query Client
---------------------------- */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: 'throw' }),
      staleTime: Infinity,
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
