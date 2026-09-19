import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Configure a React Native tailored QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 120000, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Focus refetching behaves weirdly in RN due to app state
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
