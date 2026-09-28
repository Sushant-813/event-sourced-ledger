/**
 * AccountEventsPage Component
 *
 * Route: /accounts/:accountId/events
 * Account-scoped domain event stream view.
 *
 * INVARIANTS:
 *   - Events are immutable; no edit/delete capabilities.
 *   - No eventType filter is supported by backend (preserves full chronological sequence).
 *   - Only sortBy=occurredAt is supported; direction toggles asc/desc.
 *   - Pagination and sort state synchronized with URL search params.
 */
import React, { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAccountContext } from '@/routes/AccountLayout'
import { useAccountEvents } from '../api/auditQueries'
import { EventsControls } from '../components/EventsControls'
import { EventsTable } from '../components/EventsTable'
import { EventPayloadDrawer } from '../components/EventPayloadDrawer'
import { TablePagination } from '@/components/data-display/TablePagination'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay'
import type { AccountEventResponse } from '../types/audit'
import type { SortDirection } from '@/types/common'

export const AccountEventsPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>()
  const { account } = useAccountContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedEvent, setSelectedEvent] = useState<AccountEventResponse | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // URL state extraction
  const pageParam = parseInt(searchParams.get('page') ?? '0', 10)
  const page = isNaN(pageParam) || pageParam < 0 ? 0 : pageParam

  const sizeParam = parseInt(searchParams.get('size') ?? '20', 10)
  const size = isNaN(sizeParam) || sizeParam <= 0 ? 20 : sizeParam

  const direction = (searchParams.get('direction') as SortDirection) ?? 'desc'

  const { data, isLoading, error, refetch } = useAccountEvents(accountId, {
    page,
    size,
    sortBy: 'occurredAt',
    direction,
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

  const handleInspectEvent = (event: AccountEventResponse) => {
    setSelectedEvent(event)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedEvent(null)
  }

  return (
    <div className="account-events-page">
      {/* Header */}
      <div className="account-events-page__header">
        <div>
          <h2 className="account-events-page__title">Event Stream</h2>
          <p className="account-events-page__subtitle text-muted">
            Immutable chronological domain event stream for this account.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="account-events-page__controls-bar">
        <EventsControls />
      </div>

      {/* Main Content Area */}
      <div className="account-events-page__content">
        {error ? (
          <ErrorDisplay
            error={error}
            title="Failed to Load Event Stream"
            onRetry={() => {
              void refetch()
            }}
          />
        ) : !isLoading && data && data.totalElements === 0 ? (
          <EmptyState
            title="No Events Found"
            description="No domain events have been recorded for this account."
          />
        ) : (
          <>
            <EventsTable
              events={data?.content ?? []}
              isLoading={isLoading}
              onInspectEvent={handleInspectEvent}
            />

            {data && data.totalElements > 0 && (
              <TablePagination
                page={data.page}
                size={data.size}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={handlePageChange}
                itemLabel="events"
              />
            )}
          </>
        )}
      </div>

      {/* Event Payload Slide-Over Drawer */}
      <EventPayloadDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        event={selectedEvent}
        accountContext={account}
      />

      <style>{`
        .account-events-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-base);
          width: 100%;
        }

        .account-events-page__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: var(--space-xs);
        }

        .account-events-page__title {
          font-family: var(--font-ui);
          font-size: 18px;
          font-weight: 600;
          color: var(--color-ink);
          margin: 0 0 2px 0;
        }

        .account-events-page__subtitle {
          font-size: 13px;
          margin: 0;
        }

        .account-events-page__controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }

        .account-events-page__content {
          width: 100%;
        }
      `}</style>
    </div>
  )
}
