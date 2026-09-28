/**
 * TransactionDetailModal Component
 *
 * Displays full metadata for an AccountTransactionResponse record.
 * Conforms to FRONTEND_PRD.md §10.4 and user design corrections.
 *
 * CRITICAL FINANCIAL INVARIANTS:
 *   - AccountTransactionResponse does not include an amount field.
 *   - The modal does NOT fabricate, derive, or display a monetary amount.
 *   - If account context is displayed, it is explicitly marked as page context,
 *     never as a field originating from AccountTransactionResponse.
 */
import React from 'react'
import { ModalDialog } from '@/components/overlay/ModalDialog'
import { TechnicalIdBadge } from '@/components/typography/TechnicalIdBadge'
import { formatTimestamp } from '@/utils/date'
import type { AccountTransactionResponse } from '../types/transaction'
import type { AccountResponse } from '@/features/accounts/types/account'

export interface TransactionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: AccountTransactionResponse | null
  accountContext?: AccountResponse
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  accountContext,
}) => {
  if (!transaction) return null

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Details"
      maxWidth="500px"
    >
      <div className="tx-detail-modal">
        {/* Account Context Banner (Explicitly marked as context, not a response field) */}
        {accountContext && (
          <div className="tx-detail-context">
            <span className="tx-detail-context__label text-muted">Account Context</span>
            <div className="tx-detail-context__val">
              <span className="tx-detail-context__name">{accountContext.accountName}</span>
              <TechnicalIdBadge id={accountContext.accountNumber} label="Account Number" copyable />
            </div>
          </div>
        )}

        {/* Transaction Metadata Grid */}
        <div className="tx-detail-grid">
          <div className="tx-detail-row">
            <span className="tx-detail-label">Reference Number</span>
            <span className="tx-detail-val">
              <TechnicalIdBadge
                id={transaction.referenceNumber}
                label="Reference"
                copyable
              />
            </span>
          </div>

          <div className="tx-detail-row">
            <span className="tx-detail-label">Internal Transaction ID</span>
            <span className="tx-detail-val font-mono">{transaction.transactionId}</span>
          </div>

          <div className="tx-detail-row">
            <span className="tx-detail-label">Transaction Type</span>
            <span className="tx-detail-val font-mono font-strong">{transaction.transactionType}</span>
          </div>

          <div className="tx-detail-row">
            <span className="tx-detail-label">Status</span>
            <span className="tx-detail-val font-strong">{transaction.status}</span>
          </div>

          <div className="tx-detail-row">
            <span className="tx-detail-label">Recorded At (Local)</span>
            <span className="tx-detail-val font-mono">
              {formatTimestamp(transaction.createdAt)}
            </span>
          </div>

          <div className="tx-detail-row">
            <span className="tx-detail-label">Raw Timestamp (UTC)</span>
            <span className="tx-detail-val font-mono text-muted" style={{ fontSize: '12px' }}>
              {transaction.createdAt}
            </span>
          </div>
        </div>

        {/* Informative Guidance Note */}
        <div className="tx-detail-notice" role="note">
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
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="tx-detail-notice__text">
            Double-entry financial amounts (debits and credits) are recorded in the{' '}
            <strong>Ledger</strong> tab and cross-referenced by reference number.
          </p>
        </div>

        {/* Action Button */}
        <div className="tx-detail-actions">
          <button
            type="button"
            onClick={onClose}
            className="tx-detail-close-btn"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        .tx-detail-modal {
          display: flex;
          flex-direction: column;
          gap: var(--space-base);
        }

        .tx-detail-context {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: var(--space-sm) var(--space-base);
          background: var(--surface-soft);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-hairline);
        }

        .tx-detail-context__label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tx-detail-context__val {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-wrap: wrap;
        }

        .tx-detail-context__name {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-ink);
        }

        .tx-detail-grid {
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .tx-detail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-sm) var(--space-base);
          border-bottom: 1px solid var(--border-hairline-soft);
          gap: var(--space-sm);
        }

        .tx-detail-row:last-child {
          border-bottom: none;
        }

        .tx-detail-label {
          font-family: var(--font-ui);
          font-size: 13px;
          color: var(--color-muted);
        }

        .tx-detail-val {
          font-size: 13px;
          color: var(--color-ink);
          text-align: right;
        }

        .font-strong {
          font-weight: 600;
        }

        .tx-detail-notice {
          display: flex;
          align-items: flex-start;
          gap: var(--space-xs);
          padding: var(--space-sm) var(--space-base);
          background: var(--surface-info-soft);
          border: 1px solid #bfdbfe;
          border-radius: var(--radius-md);
          color: var(--color-info);
        }

        .tx-detail-notice svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .tx-detail-notice__text {
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
          color: var(--color-ink);
        }

        .tx-detail-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: var(--space-xs);
        }

        .tx-detail-close-btn {
          height: 36px;
          padding: 0 16px;
          background: var(--surface-strong);
          color: var(--color-ink);
          border: none;
          border-radius: var(--radius-pill);
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .tx-detail-close-btn:hover {
          background: var(--border-hairline);
        }

        .tx-detail-close-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
      `}</style>
    </ModalDialog>
  )
}
