/**
 * AuditTrailPage Component
 *
 * Route: /accounts/:accountId/audit
 * Account-scoped audit trail and historical balance reconstruction view.
 *
 * CRITICAL ARCHITECTURAL & FINANCIAL INVARIANTS:
 *   - The backend is the SOLE authority for account balances and audit item deltas.
 *   - Single API request: GET /accounts/{accountId}/audit/trail via useAuditTrail.
 *   - finalBalance is taken directly from AuditTrailResponse.finalBalance.
 *   - runningBalance and balanceChange are taken directly from AuditTrailItemResponse.
 *   - ZERO client-side balance calculations, delta summations, or event replays.
 *   - URL search parameters own page, size, and asOf state.
 *   - Out-of-range pagination (HTTP 200 with items: []) is a valid empty page, not an error.
 *   - Pre-account-creation cutoff displays authoritative 0.00 as a valid financial value.
 *   - Immutability: zero edit, delete, rollback, or mutation affordances.
 */
import React from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAuditTrail } from '../api/auditQueries'
import { AuditBalanceCard } from '../components/AuditBalanceCard'
import { AuditTrailControls } from '../components/AuditTrailControls'
import { AuditTrailTable } from '../components/AuditTrailTable'
import { TablePagination } from '@/components/data-display/TablePagination'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay'

export const AuditTrailPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  // URL state extraction
  const pageParam = parseInt(searchParams.get('page') ?? '0', 10)
  const page = isNaN(pageParam) || pageParam < 0 ? 0 : pageParam

  const sizeParam = parseInt(searchParams.get('size') ?? '20', 10)
  const size = isNaN(sizeParam) || sizeParam <= 0 ? 20 : sizeParam

  const asOf = searchParams.get('asOf') || null

  const { data, isLoading, error, refetch } = useAuditTrail(accountId, {
    page,
    size,
    asOf: asOf || undefined,
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

  const handleApplyAsOf = (utcIso: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('asOf', utcIso)
        next.set('page', '0')
        return next
      },
      { replace: true }
    )
  }

  const handleResetAsOf = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('asOf')
        next.set('page', '0')
        return next
      },
      { replace: true }
    )
  }

  const isOutOfRange =
    !isLoading &&
    data !== undefined &&
    data.totalElements > 0 &&
    data.items.length === 0

  const isHistorical = Boolean(asOf || data?.asOf)

  return (
    <div className="audit-trail-page" data-testid="audit-trail-page">
      {/* Header */}
      <div className="audit-trail-page__header">
        <div>
          <h2 className="audit-trail-page__title">Audit Trail</h2>
          <p className="audit-trail-page__subtitle text-muted">
            Chronological explanation of how the account balance evolved event by event.
          </p>
        </div>
      </div>

      {/* Authoritative Balance Summary Card */}
      {data && (
        <div className="audit-trail-page__balance-card">
          <AuditBalanceCard
            finalBalance={data.finalBalance}
            asOf={data.asOf}
            totalElements={data.totalElements}
          />
        </div>
      )}

      {/* Controls Bar */}
      <div className="audit-trail-page__controls-bar">
        <AuditTrailControls
          currentAsOf={asOf || data?.asOf || null}
          onApplyAsOf={handleApplyAsOf}
          onReset={handleResetAsOf}
          isLoading={isLoading}
        />
      </div>

      {/* Content Area */}
      <div className="audit-trail-page__content">
        {error ? (
          <ErrorDisplay
            error={error}
            title="Failed to Load Audit Trail"
            onRetry={() => {
              void refetch()
            }}
          />
        ) : !isLoading && data && data.totalElements === 0 ? (
          <EmptyState
            title={isHistorical ? 'No Events Prior to Selected Cutoff' : 'No Audit Events Found'}
            description={
              isHistorical
                ? 'No domain events or ledger entries occurred on or before the selected cutoff timestamp.'
                : 'No domain events have been recorded for this account.'
            }
            action={
              isHistorical ? (
                <button
                  type="button"
                  onClick={handleResetAsOf}
                  className="audit-reset-btn"
                >
                  Reset to Current Balance
                </button>
              ) : undefined
            }
          />

        ) : (
          <>
            <AuditTrailTable
              items={data?.items ?? []}
              isLoading={isLoading}
              emptyState={
                isOutOfRange ? (
                  <div className="audit-out-of-range-empty">
                    <p className="text-muted">
                      No events found on page {page + 1} of {data?.totalPages}.
                    </p>
                    <button
                      type="button"
                      onClick={() => handlePageChange(0)}
                      className="audit-return-btn"
                    >
                      Return to Page 1
                    </button>
                  </div>
                ) : undefined
              }
            />

            {data && data.totalElements > 0 && (
              <TablePagination
                page={data.page}
                size={data.size}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={handlePageChange}
                itemLabel="audit events"
              />
            )}
          </>
        )}
      </div>

      <style>{`
        .audit-trail-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-base);
          width: 100%;
        }

        .audit-trail-page__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: var(--space-xs);
        }

        .audit-trail-page__title {
          font-family: var(--font-ui);
          font-size: 18px;
          font-weight: 600;
          color: var(--color-ink);
          margin: 0 0 2px 0;
        }

        .audit-trail-page__subtitle {
          font-size: 13px;
          margin: 0;
        }

        .audit-trail-page__balance-card {
          width: 100%;
        }

        .audit-trail-page__controls-bar {
          width: 100%;
        }

        .audit-trail-page__content {
          width: 100%;
        }

        .audit-reset-btn,
        .audit-return-btn {
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

        .audit-reset-btn:hover,
        .audit-return-btn:hover {
          background: var(--border-hairline);
        }

        .audit-reset-btn:focus-visible,
        .audit-return-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        .audit-out-of-range-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-lg);
          text-align: center;
        }
      `}</style>
    </div>
  )
}
