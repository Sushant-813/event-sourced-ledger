/**
 * TablePagination Component
 *
 * Pagination control consuming backend PagedResponse metadata per DESIGN.md §21.
 * Translates zero-based page parameter into a 1-based index for user presentation.
 */
import React from 'react'

export interface TablePaginationProps {
  page: number
  size: number
  totalPages: number
  totalElements: number
  onPageChange: (newPage: number) => void
  itemLabel?: string
  className?: string
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  size,
  totalPages,
  totalElements,
  onPageChange,
  itemLabel = 'accounts',
  className = '',
}) => {
  const startItem = totalElements === 0 ? 0 : page * size + 1
  const endItem = Math.min((page + 1) * size, totalElements)
  const isFirstPage = page <= 0
  const isLastPage = totalPages <= 0 || page >= totalPages - 1

  return (
    <nav
      className={`table-pagination ${className}`.trim()}
      aria-label="Table pagination"
    >
      <div className="table-pagination__summary">
        {totalElements === 0 ? (
          <span>No {itemLabel}</span>
        ) : (
          <span>
            Showing <strong className="font-mono">{startItem}</strong>–
            <strong className="font-mono">{endItem}</strong> of{' '}
            <strong className="font-mono">{totalElements}</strong> {itemLabel}
          </span>
        )}
      </div>

      <div className="table-pagination__controls">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage}
          className="table-pagination__btn"
          aria-label="Go to previous page"
        >
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Previous
        </button>

        <span className="table-pagination__page-indicator">
          Page <strong className="font-mono">{Math.max(1, page + 1)}</strong> of{' '}
          <strong className="font-mono">{Math.max(1, totalPages)}</strong>
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage}
          className="table-pagination__btn"
          aria-label="Go to next page"
        >
          Next
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
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <style>{`
        .table-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-base) var(--space-xs);
          font-family: var(--font-ui);
          font-size: 13px;
          color: var(--color-muted);
          flex-wrap: wrap;
          gap: var(--space-md);
        }

        .table-pagination__summary {
          font-variant-numeric: tabular-nums;
        }

        .table-pagination__summary strong {
          color: var(--color-ink);
        }

        .table-pagination__controls {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .table-pagination__page-indicator {
          font-size: 13px;
          color: var(--color-body);
          padding: 0 var(--space-xs);
        }

        .table-pagination__btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 12px;
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-pill);
          color: var(--color-ink);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }

        .table-pagination__btn:hover:not(:disabled) {
          background: var(--surface-soft);
          border-color: var(--border-hairline-soft);
        }

        .table-pagination__btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .table-pagination__btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
      `}</style>
    </nav>
  )
}
