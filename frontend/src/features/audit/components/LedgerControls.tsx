/**
 * LedgerControls Component
 *
 * Filter and sort controls for the Account Ledger view.
 * Supported controls per API_GUIDELINES.md §21:
 *   - entryType filter: All, CREDIT, DEBIT
 *   - Sort direction on createdAt: ASC / DESC
 */
import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { EntryType } from '@/types/enums'
import type { SortDirection } from '@/types/common'

export const LedgerControls: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const currentEntryType = (searchParams.get('entryType') as EntryType) || ''
  const currentDirection = (searchParams.get('direction') as SortDirection) ?? 'desc'

  const handleEntryTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (val) {
          next.set('entryType', val)
        } else {
          next.delete('entryType')
        }
        next.set('page', '0')
        return next
      },
      { replace: true }
    )
  }

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

  const handleClearFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('entryType')
        next.set('page', '0')
        return next
      },
      { replace: true }
    )
  }

  return (
    <div className="ledger-controls">
      {/* Entry Type Filter */}
      <div className="ledger-controls__group">
        <label htmlFor="filter-entry-type" className="ledger-controls__label">
          Entry Type
        </label>
        <select
          id="filter-entry-type"
          value={currentEntryType}
          onChange={handleEntryTypeChange}
          className="ledger-controls__select"
          aria-label="Filter by Entry Type"
        >
          <option value="">All Entries</option>
          <option value={EntryType.CREDIT}>Credit Only</option>
          <option value={EntryType.DEBIT}>Debit Only</option>
        </select>
      </div>

      {/* Sort Direction Toggle */}
      <div className="ledger-controls__group">
        <button
          type="button"
          onClick={toggleDirection}
          className="ledger-controls__direction-btn"
          aria-label={`Sort by date: ${currentDirection === 'asc' ? 'Oldest first' : 'Newest first'}. Click to toggle.`}
          title={currentDirection === 'asc' ? 'Ascending (Oldest First)' : 'Descending (Newest First)'}
        >
          <span className="ledger-controls__dir-label text-muted">Date:</span>
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
          <span className="ledger-controls__dir-text font-mono font-strong">
            {currentDirection === 'asc' ? 'ASC' : 'DESC'}
          </span>
        </button>
      </div>

      {/* Clear Filter */}
      {currentEntryType && (
        <button
          type="button"
          onClick={handleClearFilters}
          className="ledger-controls__clear-btn"
        >
          Clear Filter
        </button>
      )}

      <style>{`
        .ledger-controls {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex-wrap: wrap;
        }

        .ledger-controls__group {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .ledger-controls__label {
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 500;
          color: var(--color-muted);
        }

        .ledger-controls__select {
          height: 36px;
          padding: 0 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-hairline);
          background: var(--surface-card);
          color: var(--color-ink);
          font-family: var(--font-ui);
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .ledger-controls__select:focus-visible {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-soft);
          outline: none;
        }

        .ledger-controls__direction-btn {
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

        .ledger-controls__direction-btn:hover {
          background: var(--surface-soft);
        }

        .ledger-controls__direction-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        .ledger-controls__dir-label {
          font-size: 12px;
        }

        .ledger-controls__dir-text {
          font-size: 12px;
        }

        .ledger-controls__clear-btn {
          height: 36px;
          padding: 0 10px;
          background: transparent;
          border: none;
          color: var(--color-primary);
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
        }

        .ledger-controls__clear-btn:hover {
          color: var(--color-primary-active);
        }

        .font-strong {
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
