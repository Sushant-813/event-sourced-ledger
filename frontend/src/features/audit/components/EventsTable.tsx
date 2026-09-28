/**
 * EventsTable Component
 *
 * Tabular presentation of immutable domain events for an account.
 * Design specs: docs/DESIGN.md §12.4
 *
 * CRITICAL IMMUTABILITY INVARIANT:
 *   - Events are permanent historical records.
 *   - Zero edit, delete, or modification actions may ever be shown.
 *   - Events do NOT carry a balance field.
 */
import React from 'react'
import { DataTable, type ColumnDef } from '@/components/data-display/DataTable'
import { TechnicalIdBadge } from '@/components/typography/TechnicalIdBadge'
import { formatTimestamp } from '@/utils/date'
import type { AccountEventResponse } from '../types/audit'

export interface EventsTableProps {
  events: AccountEventResponse[]
  isLoading?: boolean
  onInspectEvent?: (event: AccountEventResponse) => void
  className?: string
}

function renderEventTypeBadge(type: string) {
  return (
    <span className="event-type-badge font-mono">
      {type}
      <style>{`
        .event-type-badge {
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

export const EventsTable: React.FC<EventsTableProps> = ({
  events,
  isLoading = false,
  onInspectEvent,
  className = '',
}) => {
  const columns: ColumnDef<AccountEventResponse>[] = [
    {
      key: 'occurredAt',
      header: 'Occurred At',
      accessor: (evt) => (
        <span className="font-mono text-muted" style={{ fontSize: '13px' }}>
          {formatTimestamp(evt.occurredAt)}
        </span>
      ),
      width: '180px',
    },
    {
      key: 'eventType',
      header: 'Event Type',
      accessor: (evt) => renderEventTypeBadge(evt.eventType),
      width: '180px',
    },
    {
      key: 'eventId',
      header: 'Event ID',
      accessor: (evt) => (
        <TechnicalIdBadge id={evt.eventId} label="Event ID" copyable />
      ),
      width: '140px',
    },
    {
      key: 'transactionId',
      header: 'Transaction ID',
      accessor: (evt) =>
        evt.transactionId !== null ? (
          <TechnicalIdBadge
            id={evt.transactionId}
            label="Transaction ID"
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
      key: 'actions',
      header: 'Payload',
      align: 'right',
      render: (evt) => (
        <button
          type="button"
          onClick={() => onInspectEvent?.(evt)}
          className="event-inspect-btn"
          aria-label={`Inspect event ${evt.eventId} (${evt.eventType})`}
        >
          Inspect
        </button>
      ),
      width: '110px',
    },
  ]

  return (
    <div className={`events-table-wrapper ${className}`.trim()}>
      <DataTable
        data={events}
        columns={columns}
        keyExtractor={(evt) => evt.eventId}
        isLoading={isLoading}
        ariaLabel="Account Domain Events"
      />

      <style>{`
        .events-table-wrapper {
          width: 100%;
        }

        .event-inspect-btn {
          background: transparent;
          color: var(--color-primary);
          border: none;
          padding: 6px 12px;
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .event-inspect-btn:hover {
          background: var(--color-primary-soft);
          color: var(--color-primary-active);
        }

        .event-inspect-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}
