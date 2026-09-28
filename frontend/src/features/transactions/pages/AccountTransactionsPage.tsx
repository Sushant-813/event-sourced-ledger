/**
 * AccountTransactionsPage Component
 *
 * Route: /accounts/:accountId/transactions
 * Account-scoped transaction history in event-derived canonical sequence.
 *
 * INVARIANTS:
 *   - No amount displayed or derived.
 *   - No sort or filter parameters exposed (endpoint does not support them).
 *   - Pagination state synchronized with URL search params.
 */
import React, { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAccountContext } from '@/routes/AccountLayout'
import { useAccountTransactions } from '@/features/audit/api/auditQueries'
import { TransactionsTable } from '../components/TransactionsTable'
import { TransactionDetailModal } from '../components/TransactionDetailModal'
import { TablePagination } from '@/components/data-display/TablePagination'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay'
import type { AccountTransactionResponse } from '../types/transaction'

export const AccountTransactionsPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>()
  const { account } = useAccountContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedTx, setSelectedTx] = useState<AccountTransactionResponse | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // URL pagination state
  const pageParam = parseInt(searchParams.get('page') ?? '0', 10)
  const page = isNaN(pageParam) || pageParam < 0 ? 0 : pageParam

  const sizeParam = parseInt(searchParams.get('size') ?? '20', 10)
  const size = isNaN(sizeParam) || sizeParam <= 0 ? 20 : sizeParam

  const { data, isLoading, error, refetch } = useAccountTransactions(accountId, {
    page,
    size,
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

  const handleViewDetails = (tx: AccountTransactionResponse) => {
    setSelectedTx(tx)
    setIsDetailModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsDetailModalOpen(false)
    setSelectedTx(null)
  }

  return (
    <div className="account-transactions-page">
      {/* Header */}
      <div className="account-transactions-page__header">
        <div>
          <h2 className="account-transactions-page__title">Transactions</h2>
          <p className="account-transactions-page__subtitle text-muted">
            Financial transactions affecting this account in canonical event sequence.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="account-transactions-page__content">
        {error ? (
          <ErrorDisplay
            error={error}
            title="Failed to Load Transactions"
            onRetry={() => {
              void refetch()
            }}
          />
        ) : !isLoading && data && data.totalElements === 0 ? (
          <EmptyState
            title="No Transactions Found"
            description="No transactions have been recorded for this account yet. Perform a deposit to record the initial transaction."
          />
        ) : (
          <>
            <TransactionsTable
              transactions={data?.content ?? []}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
            />

            {data && data.totalElements > 0 && (
              <TablePagination
                page={data.page}
                size={data.size}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={handlePageChange}
                itemLabel="transactions"
              />
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        transaction={selectedTx}
        accountContext={account}
      />

      <style>{`
        .account-transactions-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-base);
          width: 100%;
        }

        .account-transactions-page__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: var(--space-xs);
        }

        .account-transactions-page__title {
          font-family: var(--font-ui);
          font-size: 18px;
          font-weight: 600;
          color: var(--color-ink);
          margin: 0 0 2px 0;
        }

        .account-transactions-page__subtitle {
          font-size: 13px;
          margin: 0;
        }

        .account-transactions-page__content {
          width: 100%;
        }
      `}</style>
    </div>
  )
}
