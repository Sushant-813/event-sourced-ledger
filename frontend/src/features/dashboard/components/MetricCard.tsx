/**
 * MetricCard Component
 *
 * Displays a single portfolio metric card on the Dashboard.
 * Invariants:
 *   - Tabular monospace numbers (DESIGN.md §2.3)
 *   - Accessible loading skeleton and error states
 *   - Visual status dot and label (dual encoded, DESIGN.md §10.2)
 *   - Semantic HTML (article landmark with aria-label)
 */
import React from 'react'
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner'

export interface MetricCardProps {
  title: string
  value: number | undefined
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
  variant?: 'total' | 'active' | 'frozen'
  testId?: string
}

const VARIANT_CONFIG = {
  total: {
    color: 'var(--color-ink)',
    badgeBg: 'var(--surface-soft)',
    badgeColor: 'var(--color-muted)',
    badgeBorder: 'var(--border-hairline)',
    dotColor: 'var(--color-muted)',
    label: 'All Registered',
  },
  active: {
    color: 'var(--color-positive-text)',
    badgeBg: 'var(--surface-success-soft)',
    badgeColor: 'var(--color-positive-text)',
    badgeBorder: 'var(--border-success-soft)',
    dotColor: 'var(--color-positive)',
    label: 'Operational',
  },
  frozen: {
    color: 'var(--color-warning)',
    badgeBg: 'var(--surface-warning-soft)',
    badgeColor: 'var(--color-warning)',
    badgeBorder: 'var(--border-warning-soft)',
    dotColor: 'var(--color-warning)',
    label: 'Suspended',
  },
} as const

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  isLoading,
  isError,
  onRetry,
  variant = 'total',
  testId,
}) => {
  const config = VARIANT_CONFIG[variant]

  return (
    <article
      className="metric-card"
      data-testid={testId}
      aria-label={`${title}: ${isLoading ? 'Loading' : isError ? 'Error' : (value ?? 0)}`}
    >
      <header className="metric-card__header">
        <h3 className="metric-card__title">{title}</h3>
        <span
          className="metric-card__badge"
          style={{
            backgroundColor: config.badgeBg,
            color: config.badgeColor,
            border: `1px solid ${config.badgeBorder}`,
          }}
        >
          <span
            className="metric-card__dot"
            style={{ backgroundColor: config.dotColor }}
            aria-hidden="true"
          />
          <span>{config.label}</span>
        </span>
      </header>

      <div className="metric-card__body">
        {isLoading ? (
          <div className="metric-card__loading" aria-busy="true">
            <LoadingSpinner size="sm" label={`Loading ${title}...`} />
            <span className="text-muted text-caption">Fetching metric...</span>
          </div>
        ) : isError ? (
          <div className="metric-card__error" role="alert">
            <span className="text-caption text-negative">Failed to load metric</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="metric-card__retry-btn"
                aria-label={`Retry loading ${title}`}
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          <div className="metric-card__value font-mono">
            {value !== undefined ? value.toLocaleString() : '0'}
          </div>
        )}
      </div>

      <style>{`
        .metric-card {
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          box-shadow: var(--shadow-card, 0 1px 3px rgba(0, 0, 0, 0.04));
          transition: box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .metric-card:hover {
          border-color: #cfd4dc;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .metric-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-xs);
        }

        .metric-card__title {
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 500;
          color: var(--color-muted);
          margin: 0;
        }

        .metric-card__badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.3px;
          padding: 2px 8px;
          border-radius: var(--radius-pill);
          line-height: 1.3;
          user-select: none;
        }

        .metric-card__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .metric-card__body {
          min-height: 48px;
          display: flex;
          align-items: center;
        }

        .metric-card__value {
          font-size: 32px;
          font-weight: 700;
          color: var(--color-ink);
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .metric-card__loading {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .metric-card__error {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: var(--space-xs);
        }

        .metric-card__retry-btn {
          font-family: var(--font-ui);
          font-size: 12px;
          font-weight: 600;
          color: var(--color-primary);
          background: transparent;
          border: 1px solid var(--color-primary);
          border-radius: var(--radius-xs);
          padding: 4px 8px;
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .metric-card__retry-btn:hover {
          background: var(--color-primary-soft);
        }
      `}</style>
    </article>
  )
}
