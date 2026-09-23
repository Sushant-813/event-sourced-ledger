/**
 * AccountNotFoundView Component
 *
 * Rendered when an account ID cannot be found (404) or when accessing
 * system-restricted accounts such as SYS-CASH.
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/feedback/EmptyState'

export interface AccountNotFoundViewProps {
  accountId?: string
}

export const AccountNotFoundView: React.FC<AccountNotFoundViewProps> = ({ accountId }) => {
  return (
    <div className="account-not-found-view">
      <EmptyState
        title="Account Not Found"
        description={
          accountId
            ? `Account #${accountId} does not exist or is not accessible. Please verify the account ID or number.`
            : 'The requested account could not be found.'
        }
        icon={
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
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        }
        action={
          <Link to="/accounts" className="account-not-found-view__back-btn">
            Return to Accounts Directory
          </Link>
        }
      />

      <style>{`
        .account-not-found-view {
          padding: var(--space-xl) var(--space-base);
          max-width: 600px;
          margin: 0 auto;
        }

        .account-not-found-view__back-btn {
          display: inline-flex;
          align-items: center;
          height: 40px;
          padding: 0 20px;
          background: var(--color-primary);
          color: #ffffff;
          border-radius: var(--radius-pill);
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: background-color 0.15s ease;
        }

        .account-not-found-view__back-btn:hover {
          background: var(--color-primary-active);
        }

        .account-not-found-view__back-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}
