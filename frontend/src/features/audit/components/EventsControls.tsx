/**
 * EventsControls Component
 *
 * Controls for the Account Event Stream view.
 * Supported controls per API_GUIDELINES.md §21:
 *   - Sort direction on occurredAt: ASC / DESC
 *
 * NOTE: No eventType filter is supported by the backend (preserving complete event timeline).
 */
import React from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SortDirection } from '@/types/common'

export const EventsControls: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const currentDirection = (searchParams.get('direction') as SortDirection) ?? 'desc'

  const toggleDirection = () => {
    const nextDir: SortDirection = currentDirection === 'asc' ? 'desc' : 'asc'
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('direction', nextDir)
        next.set('page', '0')
        return next
      },
      { replace: true }
    )
  }

  return (
    <div className="events-controls">
      {/* Sort Direction Toggle */}
      <div className="events-controls__group">
        <button
          type="button"
          onClick={toggleDirection}
          className="events-controls__direction-btn"
          aria-label={`Sort by occurred timestamp: ${currentDirection === 'asc' ? 'Oldest first' : 'Newest first'}. Click to toggle.`}
          title={currentDirection === 'asc' ? 'Ascending (Oldest First)' : 'Descending (Newest First)'}
        >
          <span className="events-controls__dir-label text-muted">Sequence:</span>
          {currentDirection === 'asc' ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
          <span className="events-controls__dir-text font-mono font-strong">
            {currentDirection === 'asc' ? 'ASC (Oldest First)' : 'DESC (Newest First)'}
          </span>
        </button>
      </div>

      <style>{`
        .events-controls {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .events-controls__group {
          display: flex;
          align-items: center;
        }

        .events-controls__direction-btn {
          height: 36px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-md);
          color: var(--color-ink);
          font-family: var(--font-ui);
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }

        .events-controls__direction-btn:hover {
          background: var(--surface-soft);
        }

        .events-controls__direction-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        .events-controls__dir-label {
          font-size: 12px;
        }

        .events-controls__dir-text {
          font-size: 12px;
        }

        .font-strong {
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
