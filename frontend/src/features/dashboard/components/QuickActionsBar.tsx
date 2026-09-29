/**
 * QuickActionsBar Component
 *
 * Operational action bar on the Dashboard hosting exactly the 4 roadmap-defined
 * quick actions:
 *   1. Create Account (primary action)
 *   2. Deposit
 *   3. Withdrawal
 *   4. Transfer
 *
 * Invariants:
 *   - Accessible button elements with visible focus rings
 *   - Clear icon + text labelling
 *   - Responsive flex-wrap behavior
 */
import React from 'react'

export interface QuickActionsBarProps {
  onCreateAccount: () => void
  onDeposit: () => void
  onWithdrawal: () => void
  onTransfer: () => void
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onCreateAccount,
  onDeposit,
  onWithdrawal,
  onTransfer,
}) => {
  return (
    <div className="quick-actions-bar" role="toolbar" aria-label="Dashboard quick actions">
      <button
        type="button"
        onClick={onCreateAccount}
        className="quick-action-btn quick-action-btn--primary"
        data-testid="quick-action-create-account"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Create Account</span>
      </button>

      <button
        type="button"
        onClick={onDeposit}
        className="quick-action-btn quick-action-btn--secondary"
        data-testid="quick-action-deposit"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
        <span>Deposit</span>
      </button>

      <button
        type="button"
        onClick={onWithdrawal}
        className="quick-action-btn quick-action-btn--secondary"
        data-testid="quick-action-withdrawal"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
        <span>Withdrawal</span>
      </button>

      <button
        type="button"
        onClick={onTransfer}
        className="quick-action-btn quick-action-btn--secondary"
        data-testid="quick-action-transfer"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 5h18" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 19H3" />
        </svg>
        <span>Transfer</span>
      </button>

      <style>{`
        .quick-actions-bar {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-wrap: wrap;
        }

        .quick-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 40px;
          padding: 0 18px;
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 600;
          border-radius: var(--radius-pill);
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
          text-decoration: none;
          white-space: nowrap;
          min-width: 120px;
        }

        .quick-action-btn--primary {
          background: var(--color-primary);
          border: 1px solid var(--color-primary);
          color: #ffffff;
        }

        .quick-action-btn--primary:hover {
          background: var(--color-primary-active);
          border-color: var(--color-primary-active);
          box-shadow: 0 2px 8px rgba(0, 82, 255, 0.25);
        }

        .quick-action-btn--secondary {
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          color: var(--color-ink);
        }

        .quick-action-btn--secondary:hover {
          background: var(--surface-soft);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        @media (max-width: 639px) {
          .quick-actions-bar {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
          }

          .quick-action-btn {
            width: 100%;
            min-width: 0;
            padding: 0 12px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  )
}
