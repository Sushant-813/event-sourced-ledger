/**
 * AccountSortControl Component
 *
 * Sort controls for the Accounts Directory (sortBy and direction).
 * Reads and updates URL search parameters, resetting page to 0 on change.
 */
import React from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SortDirection } from '@/types/common'

export const AccountSortControl: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const currentSortBy = searchParams.get('sortBy') ?? 'createdAt'
  const currentDirection = (searchParams.get('direction') as SortDirection) ?? 'desc'

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('sortBy', val)
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

  return (
    <div className="account-sort">
      <label htmlFor="sort-field" className="account-sort__label">
        Sort By
      </label>
      <select
        id="sort-field"
        value={currentSortBy}
        onChange={handleSortByChange}
        className="account-sort__select"
      >
        <option value="createdAt">Date Created</option>
        <option value="accountName">Account Name</option>
        <option value="accountNumber">Account Number</option>
      </select>

      <button
        type="button"
        onClick={toggleDirection}
        className="account-sort__direction-btn"
        aria-label={`Sort direction: ${currentDirection === 'asc' ? 'Ascending' : 'Descending'}. Click to toggle.`}
        title={currentDirection === 'asc' ? 'Ascending' : 'Descending'}
      >
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
        <span className="account-sort__dir-text">
          {currentDirection.toUpperCase()}
        </span>
      </button>

      <style>{`
        .account-sort {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .account-sort__label {
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 500;
          color: var(--color-muted);
        }

        .account-sort__select {
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

        .account-sort__select:focus-visible {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-soft);
          outline: none;
        }

        .account-sort__direction-btn {
          height: 36px;
          padding: 0 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-md);
          color: var(--color-body);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }

        .account-sort__direction-btn:hover {
          background: var(--surface-soft);
          color: var(--color-ink);
        }

        .account-sort__direction-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        .account-sort__dir-text {
          font-size: 11px;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  )
}
