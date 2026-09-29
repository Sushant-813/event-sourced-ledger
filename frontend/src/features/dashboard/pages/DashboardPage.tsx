/**
 * DashboardPage Component
 *
 * Route: /dashboard
 * Portfolio landing page displaying authoritative account metrics and quick actions.
 *
 * Invariants:
 *   - Exactly 3 metrics: Total Accounts, Active Accounts, Frozen Accounts
 *   - Concurrently aggregated via 3 lightweight parallel GET /accounts queries
 *   - Zero derived or client-side calculated financial values
 *   - Exactly 4 quick actions: Create Account, Deposit, Withdrawal, Transfer
 *   - Fully responsive across all breakpoints (<640px, 640-1024px, 1024-1280px, >1280px)
 *   - WCAG 2.1 AA compliant semantics and focus management
 */
import React, { useState } from 'react'
import { useDashboardMetrics } from '../api/dashboardQueries'
import { MetricCard } from '../components/MetricCard'
import { QuickActionsBar } from '../components/QuickActionsBar'
import { CreateAccountModal } from '@/features/accounts/components/CreateAccountModal'
import { DepositModal } from '@/features/transactions/components/DepositModal'
import { WithdrawalModal } from '@/features/transactions/components/WithdrawalModal'
import { TransferModal } from '@/features/transactions/components/TransferModal'

export const DashboardPage: React.FC = () => {
  const { data, isLoading, isError, error: _error, refetch } = useDashboardMetrics()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <h1 className="dashboard-page__title">Dashboard</h1>
        <p className="dashboard-page__subtitle text-muted">
          Portfolio summary and operational quick actions.
        </p>
      </header>

      {/* Portfolio Metrics Section */}
      <section
        className="dashboard-page__section"
        aria-labelledby="portfolio-metrics-heading"
      >
        <h2 id="portfolio-metrics-heading" className="dashboard-page__section-title">
          Portfolio Metrics
        </h2>

        <div className="dashboard-page__metrics-grid">
          <MetricCard
            title="Total Accounts"
            value={data?.totalAccounts}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            variant="total"
            testId="metric-total-accounts"
          />
          <MetricCard
            title="Active Accounts"
            value={data?.activeAccounts}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            variant="active"
            testId="metric-active-accounts"
          />
          <MetricCard
            title="Frozen Accounts"
            value={data?.frozenAccounts}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            variant="frozen"
            testId="metric-frozen-accounts"
          />
        </div>
      </section>

      {/* Quick Actions Section */}
      <section
        className="dashboard-page__section"
        aria-labelledby="quick-actions-heading"
      >
        <h2 id="quick-actions-heading" className="dashboard-page__section-title">
          Quick Actions
        </h2>

        <QuickActionsBar
          onCreateAccount={() => setIsCreateOpen(true)}
          onDeposit={() => setIsDepositOpen(true)}
          onWithdrawal={() => setIsWithdrawOpen(true)}
          onTransfer={() => setIsTransferOpen(true)}
        />
      </section>

      {/* Quick Action Modals */}
      <CreateAccountModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
      />

      <WithdrawalModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />

      <style>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
          width: 100%;
        }

        .dashboard-page__header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dashboard-page__title {
          font-family: var(--font-ui);
          font-size: 28px;
          font-weight: 700;
          color: var(--color-ink);
          letter-spacing: -0.02em;
          margin: 0;
        }

        .dashboard-page__subtitle {
          font-size: 15px;
          margin: 0;
        }

        .dashboard-page__section {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .dashboard-page__section-title {
          font-family: var(--font-ui);
          font-size: 16px;
          font-weight: 600;
          color: var(--color-ink);
          letter-spacing: -0.01em;
          margin: 0;
        }

        .dashboard-page__metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-base);
        }

        @media (max-width: 767px) {
          .dashboard-page__metrics-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-page__title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  )
}
