/**
 * AccountFilters Component
 *
 * Filter controls for the Accounts Directory (Status and Account Type).
 * Reads and updates URL search parameters, resetting page to 0 on change.
 */
import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { AccountStatus, AccountType } from '@/types/enums'

export const AccountFilters: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const currentStatus = searchParams.get('status') ?? ''
  const currentType = searchParams.get('accountType') ?? ''
  const hasActiveFilters = Boolean(currentStatus || currentType)

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (val) {
          next.set('status', val)
        } else {
          next.delete('status')
        }
        next.set('page', '0')
        return next
      },
      { replace: true }
    )
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (val) {
          next.set('accountType', val)
        } else {
          next.delete('accountType')
        }
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
        next.delete('status')
        next.delete('accountType')
        next.set('page', '0')
        return next
      },
      { replace: true }
    )
  }

  return (
    <div className="account-filters">
      <div className="account-filters__group">
        <label htmlFor="filter-status" className="account-filters__label">
          Status
        </label>
        <select
          id="filter-status"
          value={currentStatus}
          onChange={handleStatusChange}
          className="account-filters__select"
        >
          <option value="">All Statuses</option>
          <option value={AccountStatus.ACTIVE}>Active</option>
          <option value={AccountStatus.FROZEN}>Frozen</option>
          <option value={AccountStatus.CLOSED}>Closed</option>
        </select>
      </div>

      <div className="account-filters__group">
        <label htmlFor="filter-type" className="account-filters__label">
          Type
        </label>
        <select
          id="filter-type"
          value={currentType}
          onChange={handleTypeChange}
          className="account-filters__select"
        >
          <option value="">All Types</option>
          <option value={AccountType.SAVINGS}>Savings</option>
          <option value={AccountType.CURRENT}>Current</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClearFilters}
          className="account-filters__clear-btn"
        >
          Clear Filters
        </button>
      )}

      <style>{`
        .account-filters {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex-wrap: wrap;
        }

        .account-filters__group {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .account-filters__label {
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 500;
          color: var(--color-muted);
        }

        .account-filters__select {
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

        .account-filters__select:focus-visible {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-soft);
          outline: none;
        }

        .account-filters__clear-btn {
          height: 36px;
          padding: 0 12px;
          background: transparent;
          border: 1px dashed var(--border-hairline);
          border-radius: var(--radius-md);
          color: var(--color-muted);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        .account-filters__clear-btn:hover {
          color: var(--color-negative);
          border-color: var(--color-negative);
        }
      `}</style>
    </div>
  )
}
