/**
 * EmptyState Component
 *
 * Presentational feedback component shown when a collection or view contains no records.
 * Provides an optional icon, title, descriptive text, and a primary action affordance.
 */
import React from 'react'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`empty-state ${className}`.trim()} role="region" aria-label={title}>
      {icon ? (
        <div className="empty-state__icon-wrapper" aria-hidden="true">
          {icon}
        </div>
      ) : (
        <div className="empty-state__icon-wrapper" aria-hidden="true">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
      )}

      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}

      <style>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--space-xxl) var(--space-lg);
          background: var(--surface-card);
          border-radius: var(--radius-lg);
        }

        .empty-state__icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--surface-soft);
          color: var(--color-muted);
          margin-bottom: var(--space-md);
        }

        .empty-state__title {
          font-family: var(--font-ui);
          font-size: 16px;
          font-weight: 600;
          color: var(--color-ink);
          margin: 0 0 var(--space-xs) 0;
        }

        .empty-state__description {
          font-family: var(--font-ui);
          font-size: 14px;
          color: var(--color-muted);
          max-width: 420px;
          line-height: 1.5;
          margin: 0;
        }

        .empty-state__action {
          margin-top: var(--space-lg);
        }
      `}</style>
    </div>
  )
}
