/**
 * EventPayloadDrawer Component
 *
 * Slide-over inspection drawer for viewing raw event JSON payloads and metadata safely.
 * Design specs: docs/DESIGN.md §14, FRONTEND_PRD.md §12.5.
 *
 * CRITICAL INVARIANTS:
 *   - Events are immutable; no edit/delete affordances.
 *   - No balance displayed (events do not store a balance).
 *   - Payloads are safely rendered inside <pre><code> without dangerous HTML injection.
 */
import React, { useState } from 'react'
import { SlideOver } from '@/components/overlay/SlideOver'
import { TechnicalIdBadge } from '@/components/typography/TechnicalIdBadge'
import { formatTimestamp } from '@/utils/date'
import type { AccountEventResponse } from '../types/audit'
import type { AccountResponse } from '@/features/accounts/types/account'

export interface EventPayloadDrawerProps {
  isOpen: boolean
  onClose: () => void
  event: AccountEventResponse | null
  accountContext?: AccountResponse
}

export const EventPayloadDrawer: React.FC<EventPayloadDrawerProps> = ({
  isOpen,
  onClose,
  event,
  accountContext,
}) => {
  const [copied, setCopied] = useState(false)

  if (!event) return null

  // Safely format JSON payload
  let formattedPayload: string | null = null
  let isJson = false

  if (event.payload !== null && event.payload !== undefined && event.payload.trim() !== '') {
    try {
      const parsed = JSON.parse(event.payload) as unknown
      formattedPayload = JSON.stringify(parsed, null, 2)
      isJson = true
    } catch {
      formattedPayload = event.payload
    }
  }

  const handleCopyPayload = async () => {
    if (!formattedPayload) return
    try {
      await navigator.clipboard.writeText(formattedPayload)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback
    }
  }

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="event-drawer-header">
          <span className="event-drawer-header__title font-mono font-strong">
            {event.eventType}
          </span>
          <TechnicalIdBadge id={event.eventId} label="Event ID" copyable />
        </div>
      }
      description="Immutable event record from the ledger event store"
      width="560px"
    >
      <div className="event-drawer-content">
        {/* Immutability Banner */}
        <div className="event-drawer-notice" role="note">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="event-drawer-notice__text">
            <strong>Immutable Record:</strong> Domain events are permanent and cannot be modified or deleted.
          </span>
        </div>

        {/* Account Context */}
        {accountContext && (
          <div className="event-drawer-context">
            <span className="event-drawer-context__label text-muted">Account Context</span>
            <div className="event-drawer-context__val">
              <span className="font-strong">{accountContext.accountName}</span>
              <TechnicalIdBadge id={accountContext.accountNumber} label="Account" copyable />
            </div>
          </div>
        )}

        {/* Event Metadata Table */}
        <div className="event-drawer-meta">
          <div className="event-drawer-meta-row">
            <span className="event-drawer-meta-label">Event ID</span>
            <span className="event-drawer-meta-val font-mono">{event.eventId}</span>
          </div>

          <div className="event-drawer-meta-row">
            <span className="event-drawer-meta-label">Event Type</span>
            <span className="event-drawer-meta-val font-mono font-strong">{event.eventType}</span>
          </div>

          <div className="event-drawer-meta-row">
            <span className="event-drawer-meta-label">Transaction ID</span>
            <span className="event-drawer-meta-val font-mono">
              {event.transactionId !== null ? (
                <TechnicalIdBadge id={event.transactionId} label="Transaction ID" copyable />
              ) : (
                <span className="text-muted">None (Lifecycle Event)</span>
              )}
            </span>
          </div>

          <div className="event-drawer-meta-row">
            <span className="event-drawer-meta-label">Occurred At (Local)</span>
            <span className="event-drawer-meta-val font-mono">
              {formatTimestamp(event.occurredAt)}
            </span>
          </div>

          <div className="event-drawer-meta-row">
            <span className="event-drawer-meta-label">Raw Timestamp (UTC)</span>
            <span className="event-drawer-meta-val font-mono text-muted" style={{ fontSize: '12px' }}>
              {event.occurredAt}
            </span>
          </div>
        </div>

        {/* Raw Payload Section */}
        <div className="event-drawer-payload-section">
          <div className="event-drawer-payload-header">
            <h3 className="event-drawer-payload-title">
              Event Payload {isJson && <span className="text-muted">(JSON)</span>}
            </h3>
            {formattedPayload && (
              <button
                type="button"
                onClick={handleCopyPayload}
                className="event-payload-copy-btn"
                aria-label="Copy event payload JSON"
              >
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
            )}
          </div>

          {formattedPayload ? (
            <div className="event-payload-box">
              <pre className="event-payload-code font-mono">
                <code>{formattedPayload}</code>
              </pre>
            </div>
          ) : (
            <div className="event-payload-empty text-muted">
              No additional payload recorded for this event.
            </div>
          )}
        </div>
      </div>

      <style>{`
        .event-drawer-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-wrap: wrap;
        }

        .event-drawer-header__title {
          font-size: 16px;
          color: var(--color-ink);
        }

        .event-drawer-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .event-drawer-notice {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-base);
          background: var(--surface-warning-soft);
          border: 1px solid #fde68a;
          border-radius: var(--radius-md);
          color: var(--color-warning);
        }

        .event-drawer-notice svg {
          flex-shrink: 0;
        }

        .event-drawer-notice__text {
          font-size: 12px;
          line-height: 1.4;
          color: var(--color-ink);
        }

        .event-drawer-context {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: var(--space-sm) var(--space-base);
          background: var(--surface-soft);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-md);
        }

        .event-drawer-context__label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .event-drawer-context__val {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-wrap: wrap;
        }

        .event-drawer-meta {
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .event-drawer-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-sm) var(--space-base);
          border-bottom: 1px solid var(--border-hairline-soft);
          gap: var(--space-sm);
        }

        .event-drawer-meta-row:last-child {
          border-bottom: none;
        }

        .event-drawer-meta-label {
          font-size: 13px;
          color: var(--color-muted);
        }

        .event-drawer-meta-val {
          font-size: 13px;
          color: var(--color-ink);
          text-align: right;
        }

        .event-drawer-payload-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .event-drawer-payload-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .event-drawer-payload-title {
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 600;
          color: var(--color-ink);
          margin: 0;
        }

        .event-payload-copy-btn {
          background: transparent;
          color: var(--color-primary);
          border: none;
          font-family: var(--font-ui);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: var(--radius-xs);
        }

        .event-payload-copy-btn:hover {
          background: var(--color-primary-soft);
        }

        .event-payload-box {
          background: var(--surface-dark);
          border-radius: var(--radius-md);
          padding: var(--space-base);
          overflow-x: auto;
          border: 1px solid var(--border-hairline);
        }

        .event-payload-code {
          margin: 0;
          color: #f7f8fa;
          font-size: 12px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .event-payload-empty {
          padding: var(--space-lg);
          background: var(--surface-soft);
          border: 1px dashed var(--border-hairline);
          border-radius: var(--radius-md);
          text-align: center;
          font-size: 13px;
        }

        .font-strong {
          font-weight: 600;
        }
      `}</style>
    </SlideOver>
  )
}
