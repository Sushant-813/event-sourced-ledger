/**
 * DataTable Component
 *
 * Generic tabular data display following DESIGN.md §12.1.
 * Supports typed columns, custom renderers, sticky header, row click handlers,
 * loading indicator, and empty state display.
 */
import React from 'react'
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner'

export interface ColumnDef<T> {
  key: string
  header: React.ReactNode
  accessor?: (item: T) => React.ReactNode
  render?: (item: T, index: number) => React.ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  keyExtractor: (item: T, index: number) => string | number
  isLoading?: boolean
  emptyState?: React.ReactNode
  onRowClick?: (item: T) => void
  className?: string
  ariaLabel?: string
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyState,
  onRowClick,
  className = '',
  ariaLabel = 'Data Table',
}: DataTableProps<T>): React.ReactElement {
  return (
    <div className={`data-table-container ${className}`.trim()}>
      <div className="data-table-scroll">
        <table className="data-table" aria-label={ariaLabel}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width, textAlign: col.align ?? 'left' }}
                  className={`data-table__th ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="data-table__loading-cell">
                  <div className="data-table__loading-wrapper">
                    <LoadingSpinner size="md" label="Loading records..." />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-table__empty-cell">
                  {emptyState ?? (
                    <div className="data-table__default-empty">No records found.</div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const key = keyExtractor(item, index)
                const isClickable = Boolean(onRowClick)

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(item)}
                    className={`data-table__row ${isClickable ? 'data-table__row--clickable' : ''}`}
                    tabIndex={isClickable ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        onRowClick?.(item)
                      }
                    }}
                  >
                    {columns.map((col) => {
                      let cellContent: React.ReactNode = null
                      if (col.render) {
                        cellContent = col.render(item, index)
                      } else if (col.accessor) {
                        cellContent = col.accessor(item)
                      }

                      return (
                        <td
                          key={col.key}
                          style={{ textAlign: col.align ?? 'left' }}
                          className={`data-table__td ${col.align === 'right' ? 'financial-value' : ''} ${col.className ?? ''}`}
                        >
                          {cellContent}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .data-table-container {
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-lg);
          overflow: hidden;
          width: 100%;
        }

        .data-table-scroll {
          overflow-x: auto;
          width: 100%;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-family: var(--font-ui);
        }

        .data-table__th {
          background: var(--surface-soft);
          color: var(--color-muted);
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: var(--space-sm) var(--space-base);
          border-bottom: 1px solid var(--border-hairline);
          white-space: nowrap;
          user-select: none;
        }

        .data-table__td {
          padding: var(--space-sm) var(--space-base);
          font-size: 14px;
          color: var(--color-ink);
          border-bottom: 1px solid var(--border-hairline-soft);
          height: 48px;
          box-sizing: border-box;
        }

        .data-table__row:last-child .data-table__td {
          border-bottom: none;
        }

        .data-table__row:hover {
          background-color: #f9fafb;
        }

        .data-table__row--clickable {
          cursor: pointer;
        }

        .data-table__row--clickable:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: -2px;
          background-color: var(--surface-soft);
        }

        .data-table__loading-cell,
        .data-table__empty-cell {
          padding: var(--space-xl) var(--space-base);
          text-align: center;
        }

        .data-table__loading-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: var(--space-lg) 0;
        }

        .data-table__default-empty {
          color: var(--color-muted);
          font-size: 14px;
          padding: var(--space-xl) 0;
        }
      `}</style>
    </div>
  )
}
