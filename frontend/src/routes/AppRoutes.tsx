/**
 * AppRoutes — Declarative Route Tree
 *
 * Complete route skeleton for Frontend Phase F0.
 * All routes for F1–F4 are present as minimal placeholder pages.
 * No placeholder renders backend data or contains feature logic.
 *
 * Route tree per approved F0 Implementation Plan §I:
 *   /                              → redirect to /dashboard
 *   /dashboard                     → DashboardPage (F0 placeholder)
 *   /accounts                      → AccountsPlaceholder (F1)
 *   /accounts/:accountId           → redirect to /accounts/:accountId/overview
 *   /accounts/:accountId/overview  → AccountOverviewPlaceholder (F1)
 *   /accounts/:accountId/transactions → AccountTransactionsPlaceholder (F3)
 *   /accounts/:accountId/ledger    → AccountLedgerPlaceholder (F3)
 *   /accounts/:accountId/events    → AccountEventsPlaceholder (F3)
 *   /accounts/:accountId/audit     → AuditTrailPlaceholder (F4)
 *   *                              → NotFoundPage
 *
 * Technology: React Router v7 createBrowserRouter + RouterProvider
 * Source: FRONTEND_ARCHITECTURE.md §3
 */
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { RootLayout } from './RootLayout'
import { AccountLayout } from './AccountLayout'
import { NotFoundPage } from './NotFoundPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'

// ---------------------------------------------------------------------------
// Minimal placeholder — renders a heading and scope note only.
// No data fetching. No feature logic.
// ---------------------------------------------------------------------------
function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <h1>{title}</h1>
      <p className="text-muted">Available in {phase}.</p>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Root redirect → /dashboard
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },

      // Dashboard — F0 placeholder
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },

      // Accounts list — F1
      {
        path: 'accounts',
        element: <Placeholder title="Accounts" phase="Phase F1" />,
      },

      // Account context — AccountLayout shell with nested sub-views
      {
        path: 'accounts/:accountId',
        element: <AccountLayout />,
        children: [
          // Index redirect → /accounts/:accountId/overview
          {
            index: true,
            element: <Navigate to="overview" replace />,
          },
          // Overview — F1
          {
            path: 'overview',
            element: <Placeholder title="Account Overview" phase="Phase F1" />,
          },
          // Transactions — F3
          {
            path: 'transactions',
            element: <Placeholder title="Transactions" phase="Phase F3" />,
          },
          // Ledger — F3
          {
            path: 'ledger',
            element: <Placeholder title="Ledger" phase="Phase F3" />,
          },
          // Events — F3
          {
            path: 'events',
            element: <Placeholder title="Events" phase="Phase F3" />,
          },
          // Audit Trail — F4
          {
            path: 'audit',
            element: <Placeholder title="Audit Trail" phase="Phase F4" />,
          },
        ],
      },

      // Catch-all 404
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}
