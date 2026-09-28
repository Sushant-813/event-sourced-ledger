/**
 * AccountLedgerPage Component
 *
 * Route: /accounts/:accountId/ledger
 * Account-scoped double-entry ledger history view.
 *
 * INVARIANTS:
 *   - Only sortBy=createdAt is supported; direction toggles asc/desc.
 *   - Optional entryType filter (CREDIT, DEBIT).
 *   - Zero red/green coloring on Debit or Credit figures.
 *   - Pagination, sort, and filter state synchronized with URL search params.
 */
import React from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAccountLedger } from '../api/auditQueries'
import { LedgerControls } from '../components/LedgerControls'
import { LedgerTable } from '../components/LedgerTable'
import { TablePagination } from '@/components/data-display/TablePagination'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay'
import type { EntryType } from '@/types/enums'
import type { SortDirection } from '@/types/common'

export const AccountLedgerPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  // URL state extraction
  const pageParam = parseInt(searchParams.get('page') ?? '0', 10)
  const page = isNaN(pageParam) || pageParam < 0 ? 0 : pageParam

  const sizeParam = parseInt(searchParams.get('size') ?? '20', 10)
  const size = isNaN(sizeParam) || sizeParam <= 0 ? 20 : sizeParam

  const direction = (searchParams.get('direction') as SortDirection) ?? 'desc'
  const entryType = (searchParams.get('entryType') as EntryType) || undefined

  const { data, isLoading, error, refetch } = useAccountLedger(accountId, {
    page,
    size,
    sortBy: 'createdAt',
    direction,
    entryType,
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
        next.delete('entryType')
        next.set('page', '0')
        return next
      },
      { replace: true }
    )
  }

  return (
    <div className="account-ledger-page">
      {/* Header */}
      <div className="account-ledger-page__header">
        <div>
          <h2 className="account-ledger-page__title">Ledger Entries</h2>
          <p className="account-ledger-page__subtitle text-muted">
            Double-entry accounting records affecting this account.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="account-ledger-page__controls-bar">
        <LedgerControls />
      </div>

      {/* Main Content Area */}
      <div className="account-ledger-page__content">
        {error ? (
          <ErrorDisplay
            error={error}
            title="Failed to Load Ledger Entries"
            onRetry={() => {
              void refetch()
            }}
          />
        ) : !isLoading && data && data.totalElements === 0 ? (
          <EmptyState
            title={entryType ? 'No Matching Ledger Entries' : 'No Ledger Entries Found'}
            description={
              entryType
                ? `No ${entryType.toLowerCase()} entries found matching the filter.`
                : 'No double-entry ledger lines have been recorded for this account yet.'
            }
            action={
              entryType ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="ledger-reset-btn"
                >
                  Clear Entry Type Filter
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <LedgerTable
              entries={data?.content ?? []}
              isLoading={isLoading}
            />

            {data && data.totalElements > 0 && (
              <TablePagination
                page={data.page}
                size={data.size}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={handlePageChange}
                itemLabel="ledger entries"
              />
            )}
          </>
        )}
      </div>

      <style>{`
        .account-ledger-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-base);
          width: 100%;
        }

        .account-ledger-page__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: var(--space-xs);
        }

        .account-ledger-page__title {
          font-family: var(--font-ui);
          font-size: 18px;
          font-weight: 600;
          color: var(--color-ink);
          margin: 0 0 2px 0;
        }

        .account-ledger-page__subtitle {
          font-size: 13px;
          margin: 0;
        }

        .account-ledger-page__controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }

        .account-ledger-page__content {
          width: 100%;
        }

        .ledger-reset-btn {
          height: 36px;
          padding: 0 16px;
          background: var(--surface-strong);
          color: var(--color-ink);
          border: none;
          border-radius: var(--radius-pill);
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .ledger-reset-btn:hover {
          background: var(--border-hairline);
        }

        .ledger-reset-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}
