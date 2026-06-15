import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';
import { ThemeProvider } from './providers/ThemeProvider';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { usingFirebase } from './lib/dataSource';
import './index.css';

if (import.meta.env.DEV) {
  console.info(
    `[LiamCoach] data backend: ${usingFirebase ? 'Firebase' : 'mock (localStorage)'}`,
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ErrorBoundary>
        <Toaster position="top-center" richColors closeButton dir="rtl" />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
