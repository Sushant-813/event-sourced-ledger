/**
 * Application Entry Point
 *
 * Mounts the React application with:
 *   - TanStack React Query provider (QueryClientProvider)
 *   - React Router v7 (RouterProvider — embedded in AppRoutes)
 *   - Global design system stylesheet (tokens + reset + typography)
 *
 * TanStack Query configuration per FRONTEND_ARCHITECTURE.md §4:
 *   - staleTime: 30s — avoids redundant refetches during navigation
 *   - gcTime: 5min — keeps cached data in memory for back-navigation UX
 *   - retry: 1 — retry once on network failures before showing error state
 *   - refetchOnWindowFocus: false — financial data is refreshed by
 *     explicit user actions and mutation invalidation, not tab focus
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from './components/feedback/ToastProvider'
import { AppRoutes } from './routes/AppRoutes'
import './styles/main.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // 30 seconds
      gcTime: 5 * 60_000,     // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('Root element #root not found in the document.')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>
)

