/**
 * LedgerTable Component
 *
 * Tabular presentation of double-entry ledger entries affecting this account.
 * Design specs: docs/DESIGN.md §12.3
 *
 * CRITICAL ACCOUNTING INVARIANT:
 *   - DEBIT and CREDIT columns are formatted with neutral numerical typography (--color-ink).
 *   - Neither column is colored red or green (DESIGN.md §2.4, §12.3, §29).
 *   - All monetary amounts parsed through Money.fromWire(amount).
 */
import React from 'react'
import { DataTable, type ColumnDef } from '@/components/data-display/DataTable'
import { TechnicalIdBadge } from '@/components/typography/TechnicalIdBadge'
import { formatTimestamp } from '@/utils/date'
import { Money } from '@/utils/money'
import { EntryType } from '@/types/enums'
import type { AccountLedgerEntryResponse } from '../types/audit'

export interface LedgerTableProps {
  entries: AccountLedgerEntryResponse[]
  isLoading?: boolean
  className?: string
}

function renderEntryTypeBadge(entryType: EntryType) {
  return (
    <span className="ledger-entry-type-badge font-mono">
      {entryType}
      <style>{`
        .ledger-entry-type-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: var(--radius-xs);
          background: var(--surface-soft);
          border: 1px solid var(--border-hairline);
          color: var(--color-ink);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
      `}</style>
    </span>
  )
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  entries,
  isLoading = false,
  className = '',
}) => {
  const columns: ColumnDef<AccountLedgerEntryResponse>[] = [
    {
      key: 'createdAt',
      header: 'Date',
      accessor: (entry) => (
        <span className="font-mono text-muted" style={{ fontSize: '13px' }}>
          {formatTimestamp(entry.createdAt)}
        </span>
      ),
      width: '180px',
    },
    {
      key: 'referenceNumber',
      header: 'Reference #',
      accessor: (entry) => (
        <TechnicalIdBadge id={entry.referenceNumber} label="Reference" copyable />
      ),
      width: '240px',
    },
    {
      key: 'entryType',
      header: 'Entry Type',
      accessor: (entry) => renderEntryTypeBadge(entry.entryType),
      width: '140px',
    },
    {
      key: 'debit',
      header: 'Debit (₹)',
      align: 'right',
      accessor: (entry) => {
        if (entry.entryType === EntryType.DEBIT) {
          const money = Money.fromWire(entry.amount)
          return (
            <span className="ledger-amount font-mono">
              {money.format()}
            </span>
          )
        }
        return <span className="ledger-dash text-muted">—</span>
      },
      width: '160px',
    },
    {
      key: 'credit',
      header: 'Credit (₹)',
      align: 'right',
      accessor: (entry) => {
        if (entry.entryType === EntryType.CREDIT) {
          const money = Money.fromWire(entry.amount)
          return (
            <span className="ledger-amount font-mono">
              {money.format()}
            </span>
          )
        }
        return <span className="ledger-dash text-muted">—</span>
      },
      width: '160px',
    },
  ]

  return (
    <div className={`ledger-table-wrapper ${className}`.trim()}>
      <DataTable
        data={entries}
        columns={columns}
        keyExtractor={(entry) => entry.ledgerEntryId}
        isLoading={isLoading}
        ariaLabel="Account Ledger Entries"
      />

      <style>{`
        .ledger-table-wrapper {
          width: 100%;
        }

        .ledger-amount {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-ink);
          font-variant-numeric: tabular-nums;
        }

        .ledger-dash {
          font-size: 14px;
          user-select: none;
        }
      `}</style>
    </div>
  )
}
