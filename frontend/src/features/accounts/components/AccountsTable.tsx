/**
 * AccountsTable Component
 *
 * Table display for the accounts directory.
 * Consumes AccountResponse records from GET /accounts.
 *
 * FINANCIAL INVARIANT (FRONTEND_ARCHITECTURE.md §10.1):
 *   NO balances are displayed in this directory table.
 *   Balances are authoritative and loaded exclusively in account-detail context.
 *   There must be no N+1 balance query pattern.
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable, type ColumnDef } from '@/components/data-display/DataTable'
import { StatusBadge } from '@/components/typography/StatusBadge'
import { TechnicalIdBadge } from '@/components/typography/TechnicalIdBadge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { formatDate } from '@/utils/date'
import type { AccountResponse } from '../types/account'

export interface AccountsTableProps {
  accounts: AccountResponse[]
  isLoading?: boolean
  hasActiveFilters?: boolean
  onClearFilters?: () => void
  onCreateClick?: () => void
}

export const AccountsTable: React.FC<AccountsTableProps> = ({
  accounts,
  isLoading = false,
  hasActiveFilters = false,
  onClearFilters,
  onCreateClick,
}) => {
  const navigate = useNavigate()

  const columns: ColumnDef<AccountResponse>[] = [
    {
      key: 'accountNumber',
      header: 'Account Number',
      render: (account) => (
        <TechnicalIdBadge id={account.accountNumber} label="Account" copyable />
      ),
      width: '180px',
    },
    {
      key: 'accountName',
      header: 'Account Name',
      render: (account) => (
        <span className="accounts-table__name">{account.accountName}</span>
      ),
    },
    {
      key: 'accountType',
      header: 'Type',
      render: (account) => (
        <span className="accounts-table__type">{account.accountType}</span>
      ),
      width: '120px',
    },
    {
      key: 'status',
      header: 'Status',
      render: (account) => <StatusBadge status={account.status} />,
      width: '130px',
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (account) => (
        <span className="text-muted font-mono">{formatDate(account.createdAt)}</span>
      ),
      width: '140px',
    },
    {
      key: 'actions',
      header: '',
      render: (account) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/accounts/${account.id}`)
          }}
          className="accounts-table__view-btn"
          aria-label={`View account ${account.accountName}`}
        >
          View →
        </button>
      ),
      align: 'right',
      width: '90px',
    },
  ]

  const emptyState = hasActiveFilters ? (
    <EmptyState
      title="No Matching Accounts"
      description="No accounts match your current filter criteria. Try adjusting or clearing the filters."
      action={
        onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="accounts-table__empty-action-btn"
          >
            Clear Filters
          </button>
        )
      }
    />
  ) : (
    <EmptyState
      title="No Accounts Found"
      description="No accounts have been registered on the ledger yet. Create your first account to begin recording transactions."
      action={
        onCreateClick && (
          <button
            type="button"
            onClick={onCreateClick}
            className="accounts-table__empty-action-btn"
          >
            + Create Account
          </button>
        )
      }
    />
  )

  return (
    <div className="accounts-table-wrapper">
      <DataTable
        data={accounts}
        columns={columns}
        keyExtractor={(account) => account.id}
        isLoading={isLoading}
        emptyState={emptyState}
        onRowClick={(account) => navigate(`/accounts/${account.id}`)}
        ariaLabel="Accounts Directory"
      />

      <style>{`
        .accounts-table-wrapper {
          width: 100%;
        }

        .accounts-table__name {
          font-weight: 600;
          color: var(--color-ink);
        }

        .accounts-table__type {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-body);
        }

        .accounts-table__view-btn {
          background: transparent;
          border: none;
          color: var(--color-primary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-xs);
          transition: background-color 0.15s ease;
        }

        .accounts-table__view-btn:hover {
          background: var(--color-primary-soft);
        }

        .accounts-table__empty-action-btn {
          height: 38px;
          padding: 0 18px;
          background: var(--color-primary);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-pill);
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .accounts-table__empty-action-btn:hover {
          background: var(--color-primary-active);
        }
      `}</style>
    </div>
  )
}
