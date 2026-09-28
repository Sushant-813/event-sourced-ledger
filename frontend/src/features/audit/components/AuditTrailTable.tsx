/**
 * AuditTrailTable Component
 *
 * Tabular presentation of the chronological audit trail explaining how the account
 * balance evolved event by event.
 * Design specs: docs/DESIGN.md §12.1, §13, FRONTEND_PRD.md §13.
 *
 * COLUMN ORDER (per approved plan & DESIGN.md):
 *   1. Occurred At
 *   2. Event Type
 *   3. Event ID
 *   4. Reference #
 *   5. Transaction ID
 *   6. Balance Change (₹)
 *   7. Running Balance (₹)
 *
 * CRITICAL FINANCIAL & IMMUTABILITY INVARIANTS:
 *   - balanceChange is the authoritative delta from backend.
 *   - runningBalance is the cumulative reconstructed balance from backend.
 *   - Zero client-side arithmetic or balance recalculations.
 *   - Tabular numeric typography on all financial columns.
 *   - No red for DEBIT merely because it is a debit; no green for CREDIT merely because it is a credit.
 *   - Immutability: zero edit, delete, rollback, or mutation controls.
 *   - Canonical sequence: no arbitrary client-side sorting or filtering.
 */
import React from 'react'
import { DataTable, type ColumnDef } from '@/components/data-display/DataTable'
import { TechnicalIdBadge } from '@/components/typography/TechnicalIdBadge'
import { formatTimestamp } from '@/utils/date'
import { Money } from '@/utils/money'
import type { AuditTrailItemResponse } from '../types/audit'

export interface AuditTrailTableProps {
  items: AuditTrailItemResponse[]
  isLoading?: boolean
  emptyState?: React.ReactNode
  className?: string
}

function renderEventTypeBadge(type: string) {
  return (
    <span className="audit-event-type-badge font-mono">
      {type}
      <style>{`
        .audit-event-type-badge {
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

export const AuditTrailTable: React.FC<AuditTrailTableProps> = ({
  items,
  isLoading = false,
  emptyState,
  className = '',
}) => {
  const columns: ColumnDef<AuditTrailItemResponse>[] = [
    {
      key: 'occurredAt',
      header: 'Occurred At',
      accessor: (item) => (
        <span className="font-mono text-muted" style={{ fontSize: '13px' }}>
          {formatTimestamp(item.occurredAt)}
        </span>
      ),
      width: '180px',
    },
    {
      key: 'eventType',
      header: 'Event Type',
      accessor: (item) => renderEventTypeBadge(item.eventType),
      width: '180px',
    },
    {
      key: 'eventId',
      header: 'Event ID',
      accessor: (item) => (
        <TechnicalIdBadge id={item.eventId} label="Event ID" copyable />
      ),
      width: '130px',
    },
    {
      key: 'referenceNumber',
      header: 'Reference #',
      accessor: (item) =>
        item.referenceNumber !== null && item.referenceNumber !== undefined ? (
          <TechnicalIdBadge
            id={item.referenceNumber}
            label="Reference"
            copyable
          />
        ) : (
          <span className="text-muted" style={{ fontSize: '13px' }}>
            —
          </span>
        ),
      width: '160px',
    },
    {
      key: 'transactionId',
      header: 'Transaction ID',
      accessor: (item) =>
        item.transactionId !== null && item.transactionId !== undefined ? (
          <TechnicalIdBadge
            id={item.transactionId}
            label="Transaction ID"
            copyable
          />
        ) : (
          <span className="text-muted" style={{ fontSize: '13px' }}>
            —
          </span>
        ),
      width: '150px',
    },
    {
      key: 'balanceChange',
      header: 'Balance Change (₹)',
      align: 'right',
      accessor: (item) => {
        const money = Money.fromWire(item.balanceChange)
        const isPos = money.isPositive()
        const formatted = money.format({ showPositiveSign: true })

        return (
          <span
            className={`audit-trail-delta font-mono ${isPos ? 'audit-trail-delta--positive' : ''}`}
          >
            {formatted}
          </span>
        )
      },
      width: '160px',
    },
    {
      key: 'runningBalance',
      header: 'Running Balance (₹)',
      align: 'right',
      accessor: (item) => {
        const money = Money.fromWire(item.runningBalance)
        return (
          <span className="audit-trail-running-balance font-mono">
            {money.format()}
          </span>
        )
      },
      width: '170px',
    },
  ]

  return (
    <div className={`audit-trail-table-wrapper ${className}`.trim()} data-testid="audit-trail-table">
      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(item) => item.eventId}
        isLoading={isLoading}
        emptyState={emptyState}
        ariaLabel="Account Audit Trail"
      />

      <style>{`
        .audit-trail-table-wrapper {
          width: 100%;
        }

        .audit-trail-delta {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-ink);
          font-variant-numeric: tabular-nums;
        }

        .audit-trail-delta--positive {
          color: var(--color-positive-text);
        }

        .audit-trail-running-balance {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-ink);
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  )
}
