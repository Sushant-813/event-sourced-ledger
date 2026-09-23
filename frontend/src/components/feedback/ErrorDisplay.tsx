/**
 * ErrorDisplay Component
 *
 * Renders normalized error states from ApiError or generic exceptions.
 * Surfaces specific backend messages (especially for 422 business-rule errors)
 * and provides a retry callback when recoverable.
 */
import React from 'react'
import { ApiError, isApiError } from '@/api/errors'

export interface ErrorDisplayProps {
  error: ApiError | Error | unknown
  title?: string
  onRetry?: () => void
  className?: string
  compact?: boolean
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title,
  onRetry,
  className = '',
  compact = false,
}) => {
  let displayTitle = title
  let displayMessage = 'An unexpected error occurred. Please try again.'

  if (isApiError(error)) {
    if (error.isNetworkError) {
      displayTitle = displayTitle ?? 'Connection Error'
      displayMessage =
        'Unable to connect to the ledger server. Please check your network connection.'
    } else {
      displayTitle = displayTitle ?? error.errorTitle ?? 'Request Failed'
      displayMessage = error.serverMessage || displayMessage
    }
  } else if (error instanceof Error) {
    displayMessage = error.message
    displayTitle = displayTitle ?? 'Error'
  }

  return (
    <div
      className={`error-display ${compact ? 'error-display--compact' : ''} ${className}`.trim()}
      role="alert"
    >
      <div className="error-display__icon" aria-hidden="true">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div className="error-display__content">
        {displayTitle && <h4 className="error-display__title">{displayTitle}</h4>}
        <p className="error-display__message">{displayMessage}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="error-display__retry-btn"
        >
          Retry
        </button>
      )}

      <style>{`
        .error-display {
          display: flex;
          align-items: flex-start;
          gap: var(--space-sm);
          padding: var(--space-base);
          background: var(--surface-error-soft);
          border: 1px solid #fecaca;
          border-radius: var(--radius-md);
          color: var(--color-ink);
        }

        .error-display--compact {
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-sm);
          font-size: 13px;
        }

        .error-display__icon {
          color: var(--color-negative);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .error-display__content {
          flex: 1;
          min-width: 0;
        }

        .error-display__title {
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 600;
          color: var(--color-negative);
          margin: 0 0 4px 0;
        }

        .error-display__message {
          font-family: var(--font-ui);
          font-size: 13px;
          color: var(--color-body);
          margin: 0;
          line-height: 1.4;
          word-break: break-word;
        }

        .error-display__retry-btn {
          align-self: center;
          background: #ffffff;
          border: 1px solid #fca5a5;
          color: var(--color-negative);
          border-radius: var(--radius-pill);
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.15s ease;
        }

        .error-display__retry-btn:hover {
          background: #fef2f2;
        }
      `}</style>
    </div>
  )
}
