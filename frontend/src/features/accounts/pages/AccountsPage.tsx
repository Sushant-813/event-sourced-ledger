/**
 * AccountsPage Component
 *
 * Route: /accounts
 * Primary account directory view for browsing, filtering, sorting,
 * and creating ledger accounts.
 */
import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAccounts } from '../api/accountQueries'
import { AccountsTable } from '../components/AccountsTable'
import { AccountFilters } from '../components/AccountFilters'
import { AccountSortControl } from '../components/AccountSortControl'
import { CreateAccountModal } from '../components/CreateAccountModal'
import { TablePagination } from '@/components/data-display/TablePagination'
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay'
import { AccountStatus, AccountType } from '@/types/enums'
import type { SortDirection } from '@/types/common'

export const AccountsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // URL state extraction with safe defaults
  const pageParam = parseInt(searchParams.get('page') ?? '0', 10)
  const page = isNaN(pageParam) || pageParam < 0 ? 0 : pageParam

  const sizeParam = parseInt(searchParams.get('size') ?? '20', 10)
  const size = isNaN(sizeParam) || sizeParam <= 0 ? 20 : sizeParam

  const sortBy = searchParams.get('sortBy') ?? 'createdAt'
  const direction = (searchParams.get('direction') as SortDirection) ?? 'desc'
  const status = (searchParams.get('status') as AccountStatus) || undefined
  const accountType = (searchParams.get('accountType') as AccountType) || undefined

  const hasActiveFilters = Boolean(status || accountType)

  // Query server state
  const { data, isLoading, error, refetch } = useAccounts({
    page,
    size,
    sortBy,
    direction,
    status,
    accountType,
  })

  const handlePageChange = (newPage: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(newPage))
        return next
      },
      { replace: true }
    )
  }

  const handleClearFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('status')
        next.delete('accountType')
        next.set('page', '0')
        return next
      },
      { replace: true }
    )
  }

  return (
    <div className="accounts-page">
      {/* Header with Title and Create Action */}
      <header className="accounts-page__header">
        <div className="accounts-page__title-group">
          <h1 className="accounts-page__title">Accounts</h1>
          <p className="accounts-page__subtitle text-muted">
            Directory of institutional accounts and double-entry ledgers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="accounts-page__create-btn"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Account
        </button>
      </header>

      {/* Controls: Filter and Sort */}
      <div className="accounts-page__controls-bar">
        <AccountFilters />
        <AccountSortControl />
      </div>

      {/* Main Content Area */}
      <div className="accounts-page__content">
        {error ? (
          <ErrorDisplay
            error={error}
            title="Failed to Load Accounts"
            onRetry={() => {
              void refetch()
            }}
          />
        ) : (
          <>
            <AccountsTable
              accounts={data?.content ?? []}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              onCreateClick={() => setIsCreateModalOpen(true)}
            />

            {data && data.totalElements > 0 && (
              <TablePagination
                page={data.page}
                size={data.size}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={handlePageChange}
                itemLabel="accounts"
              />
            )}
          </>
        )}
      </div>

      {/* Create Account Modal */}
      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <style>{`
        .accounts-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          width: 100%;
        }

        .accounts-page__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-md);
        }

        .accounts-page__title-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-xxs);
        }

        .accounts-page__title {
          font-family: var(--font-ui);
          font-size: 28px;
          font-weight: 700;
          color: var(--color-ink);
          margin: 0;
          line-height: 1.2;
        }

        .accounts-page__subtitle {
          font-size: 14px;
          margin: 0;
        }

        .accounts-page__create-btn {
          height: 40px;
          padding: 0 20px;
          background: var(--color-primary);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-pill);
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .accounts-page__create-btn:hover {
          background: var(--color-primary-active);
        }

        .accounts-page__create-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        .accounts-page__controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-md);
          background: var(--surface-card);
          padding: var(--space-sm) var(--space-base);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-lg);
        }

        .accounts-page__content {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
      `}</style>
    </div>
  )
}
