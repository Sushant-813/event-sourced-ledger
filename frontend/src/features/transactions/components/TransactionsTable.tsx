/**
 * TransactionsTable Component
 *
 * Tabular presentation of account transactions in event-derived canonical sequence.
 * Design specs: docs/DESIGN.md §12.2
 *
 * CRITICAL FINANCIAL INVARIANT:
 *   - AccountTransactionResponse does NOT include an amount field.
 *   - The frontend must NOT display, derive, or fabricate an amount for this table.
 */
import React from 'react'
import { DataTable, type ColumnDef } from '@/components/data-display/DataTable'
import { TechnicalIdBadge } from '@/components/typography/TechnicalIdBadge'
import { formatTimestamp } from '@/utils/date'
import { TransactionStatus } from '@/types/enums'
import type { AccountTransactionResponse } from '../types/transaction'

export interface TransactionsTableProps {
  transactions: AccountTransactionResponse[]
  isLoading?: boolean
  onViewDetails?: (transaction: AccountTransactionResponse) => void
  className?: string
}

function renderStatusBadge(status: TransactionStatus) {
  let bg = 'var(--surface-soft)'
  let color = 'var(--color-muted)'
  let border = 'var(--border-hairline)'

  if (status === TransactionStatus.COMPLETED) {
    bg = 'var(--surface-success-soft)'
    color = 'var(--color-positive-text)'
    border = 'var(--border-success-soft)'
  } else if (status === TransactionStatus.PENDING) {
    bg = 'var(--surface-warning-soft)'
    color = 'var(--color-warning)'
    border = 'var(--border-warning-soft)'
  } else if (status === TransactionStatus.FAILED) {
    bg = 'var(--surface-error-soft)'
    color = 'var(--color-negative)'
    border = 'var(--border-error-soft)'
  }

  return (
    <span
      className="tx-status-badge"
      style={{
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      <span className="tx-status-badge__dot" style={{ backgroundColor: color }} aria-hidden="true" />
      {status}
      <style>{`
        .tx-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          border-radius: var(--radius-pill);
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          line-height: 1.4;
          white-space: nowrap;
        }
        .tx-status-badge__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>
    </span>
  )
}

function renderTypeBadge(type: string) {
  return (
    <span className="tx-type-badge font-mono">
      {type}
      <style>{`
        .tx-type-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: var(--radius-xs);
          background: var(--surface-soft);
          border: 1px solid var(--border-hairline);
          color: var(--color-ink);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.3px;
        }
      `}</style>
    </span>
  )
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  isLoading = false,
  onViewDetails,
  className = '',
}) => {
  const columns: ColumnDef<AccountTransactionResponse>[] = [
    {
      key: 'createdAt',
      header: 'Date',
      accessor: (tx) => (
        <span className="font-mono text-muted" style={{ fontSize: '13px' }}>
          {formatTimestamp(tx.createdAt)}
        </span>
      ),
      width: '180px',
    },
    {
      key: 'referenceNumber',
      header: 'Reference #',
      accessor: (tx) => (
        <TechnicalIdBadge id={tx.referenceNumber} label="Reference" copyable />
      ),
      width: '260px',
    },
    {
      key: 'transactionType',
      header: 'Type',
      accessor: (tx) => renderTypeBadge(tx.transactionType),
      width: '140px',
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (tx) => renderStatusBadge(tx.status),
      width: '140px',
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (tx) => (
        <button
          type="button"
          onClick={() => onViewDetails?.(tx)}
          className="tx-details-btn"
          aria-label={`View details for transaction ${tx.referenceNumber}`}
        >
          View Details
        </button>
      ),
      width: '120px',
    },
  ]

  return (
    <div className={`transactions-table-wrapper ${className}`.trim()}>
      <DataTable
        data={transactions}
        columns={columns}
        keyExtractor={(tx) => tx.transactionId}
        isLoading={isLoading}
        ariaLabel="Account Transactions"
      />

      <style>{`
        .transactions-table-wrapper {
          width: 100%;
        }

        .tx-details-btn {
          background: transparent;
          color: var(--color-primary);
          border: none;
          padding: 6px 10px;
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .tx-details-btn:hover {
          background: var(--color-primary-soft);
          color: var(--color-primary-active);
        }

        .tx-details-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}
