/**
 * AccountOverviewPage Component
 *
 * Route: /accounts/:accountId/overview
 * Real F1 account overview displaying identity metadata, authoritative current balance,
 * and lifecycle action controls (Freeze, Activate, Close).
 */
import React, { useState } from 'react'
import { useAccountContext } from '@/routes/AccountLayout'
import {
  useFreezeAccount,
  useActivateAccount,
  useCloseAccount,
} from '../api/accountMutations'
import { FreezeConfirmDialog } from '../components/FreezeConfirmDialog'
import { CloseConfirmDialog } from '../components/CloseConfirmDialog'
import { StatusBadge } from '@/components/typography/StatusBadge'
import { TechnicalIdBadge } from '@/components/typography/TechnicalIdBadge'
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner'
import { useToast } from '@/hooks/useToast'
import { formatTimestamp } from '@/utils/date'
import { isBusinessRuleViolation, isApiError } from '@/api/errors'
import { AccountStatus } from '@/types/enums'

export const AccountOverviewPage: React.FC = () => {
  const {
    account,
    balanceString,
    isBalanceLoading,
    balanceError,
    refetchBalance,
  } = useAccountContext()

  const toast = useToast()

  const [isFreezeDialogOpen, setIsFreezeDialogOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)

  const { mutateAsync: freezeAccount, isPending: isFreezePending } = useFreezeAccount()
  const { mutateAsync: activateAccount, isPending: isActivatePending } = useActivateAccount()
  const { mutateAsync: closeAccount, isPending: isClosePending } = useCloseAccount()

  const isMutating = isFreezePending || isActivatePending || isClosePending

  const handleFreeze = async () => {
    try {
      await freezeAccount(account.id)
      setIsFreezeDialogOpen(false)
      toast.success(
        'Account Frozen',
        `Account ${account.accountNumber} has been transitioned to FROZEN.`
      )
    } catch (err: unknown) {
      if (isBusinessRuleViolation(err) && isApiError(err)) {
        toast.error('Lifecycle Action Rejected', err.serverMessage)
      } else if (isApiError(err)) {
        toast.error('Error', err.serverMessage)
      } else {
        toast.error('Error', 'Unable to freeze account. Please try again.')
      }
    }
  }

  const handleActivate = async () => {
    try {
      await activateAccount(account.id)
      toast.success(
        'Account Activated',
        `Account ${account.accountNumber} has been reactivated to ACTIVE status.`
      )
    } catch (err: unknown) {
      if (isBusinessRuleViolation(err) && isApiError(err)) {
        toast.error('Lifecycle Action Rejected', err.serverMessage)
      } else if (isApiError(err)) {
        toast.error('Error', err.serverMessage)
      } else {
        toast.error('Error', 'Unable to activate account. Please try again.')
      }
    }
  }

  const handleClose = async () => {
    try {
      await closeAccount(account.id)
      setIsCloseDialogOpen(false)
      toast.warning(
        'Account Closed',
        `Account ${account.accountNumber} has been permanently CLOSED.`
      )
    } catch (err: unknown) {
      if (isBusinessRuleViolation(err) && isApiError(err)) {
        toast.error('Close Action Rejected', err.serverMessage)
      } else if (isApiError(err)) {
        toast.error('Error', err.serverMessage)
      } else {
        toast.error('Error', 'Unable to close account. Please try again.')
      }
    }
  }

  return (
    <div className="account-overview">
      <div className="account-overview__grid">
        {/* Left Column: Account Details & Authoritative Balance */}
        <div className="account-overview__primary-col">
          {/* Balance Card */}
          <section className="account-overview-card" aria-labelledby="balance-card-title">
            <div className="account-overview-card__header">
              <h2 id="balance-card-title" className="account-overview-card__title">
                Authoritative Current Balance
              </h2>
              <button
                type="button"
                onClick={() => {
                  void refetchBalance()
                }}
                disabled={isBalanceLoading}
                className="account-overview__refresh-btn"
                title="Refresh balance from authoritative server"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isBalanceLoading ? 'account-overview__spin' : ''}
                  aria-hidden="true"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Refresh
              </button>
            </div>

            <div className="account-overview__balance-container">
              {isBalanceLoading ? (
                <div className="account-overview__balance-loading">
                  <LoadingSpinner size="md" label="Reconstructing balance..." />
                </div>
              ) : balanceError ? (
                <div className="account-overview__balance-error">
                  <span className="text-negative font-medium">Balance Unavailable</span>
                  <p className="text-caption text-muted">
                    Could not obtain authoritative balance from server.
                  </p>
                </div>
              ) : (
                <div className="account-overview__balance-display font-mono">
                  <span className="account-overview__currency-symbol">₹</span>{' '}
                  <span className="account-overview__balance-amount">
                    {balanceString}
                  </span>
                </div>
              )}
              <p className="account-overview__balance-hint text-caption text-muted">
                Authoritative balance derived by the backend from chronological event
                stream and double-entry ledger entries.
              </p>
            </div>
          </section>

          {/* Account Details Card */}
          <section className="account-overview-card" aria-labelledby="details-card-title">
            <div className="account-overview-card__header">
              <h2 id="details-card-title" className="account-overview-card__title">
                Account Information
              </h2>
            </div>

            <dl className="account-overview__details-list">
              <div className="account-overview__details-row">
                <dt className="account-overview__dt">Account Name</dt>
                <dd className="account-overview__dd font-medium">
                  {account.accountName}
                </dd>
              </div>

              <div className="account-overview__details-row">
                <dt className="account-overview__dt">Account Number</dt>
                <dd className="account-overview__dd">
                  <TechnicalIdBadge id={account.accountNumber} label="Account Number" />
                </dd>
              </div>

              <div className="account-overview__details-row">
                <dt className="account-overview__dt">Account Type</dt>
                <dd className="account-overview__dd">
                  <span className="account-overview__type-chip font-mono">
                    {account.accountType}
                  </span>
                </dd>
              </div>

              <div className="account-overview__details-row">
                <dt className="account-overview__dt">Status</dt>
                <dd className="account-overview__dd">
                  <StatusBadge status={account.status} />
                </dd>
              </div>

              <div className="account-overview__details-row">
                <dt className="account-overview__dt">Internal ID</dt>
                <dd className="account-overview__dd">
                  <TechnicalIdBadge id={account.id} label="Internal ID" />
                </dd>
              </div>

              <div className="account-overview__details-row">
                <dt className="account-overview__dt">Created</dt>
                <dd className="account-overview__dd font-mono text-muted">
                  {formatTimestamp(account.createdAt)}
                </dd>
              </div>

              <div className="account-overview__details-row">
                <dt className="account-overview__dt">Last Updated</dt>
                <dd className="account-overview__dd font-mono text-muted">
                  {formatTimestamp(account.updatedAt)}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Right Column: Lifecycle Operations */}
        <div className="account-overview__secondary-col">
          <section className="account-overview-card" aria-labelledby="lifecycle-card-title">
            <div className="account-overview-card__header">
              <h2 id="lifecycle-card-title" className="account-overview-card__title">
                Lifecycle Actions
              </h2>
            </div>

            <div className="account-overview__lifecycle-body">
              {account.status === AccountStatus.ACTIVE && (
                <div className="account-overview__action-group">
                  <p className="account-overview__action-description text-muted">
                    This account is <strong>ACTIVE</strong> and eligible for deposits,
                    withdrawals, and transfers.
                  </p>

                  <div className="account-overview__button-stack">
                    <button
                      type="button"
                      onClick={() => setIsFreezeDialogOpen(true)}
                      disabled={isMutating}
                      className="account-overview__btn account-overview__btn--warning"
                    >
                      Freeze Account
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCloseDialogOpen(true)}
                      disabled={isMutating}
                      className="account-overview__btn account-overview__btn--destructive"
                    >
                      Close Account
                    </button>
                  </div>
                </div>
              )}

              {account.status === AccountStatus.FROZEN && (
                <div className="account-overview__action-group">
                  <div className="account-overview__notice-banner account-overview__notice-banner--warning">
                    <strong>Account is Frozen</strong>
                    <p>All deposits, withdrawals, and outgoing transfers are currently suspended.</p>
                  </div>

                  <div className="account-overview__button-stack">
                    <button
                      type="button"
                      onClick={handleActivate}
                      disabled={isMutating}
                      className="account-overview__btn account-overview__btn--primary"
                    >
                      {isActivatePending ? (
                        <span className="account-overview__loading-inline">
                          <LoadingSpinner size="sm" />
                          <span>Reactivating...</span>
                        </span>
                      ) : (
                        'Reactivate Account'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCloseDialogOpen(true)}
                      disabled={isMutating}
                      className="account-overview__btn account-overview__btn--destructive"
                    >
                      Close Account
                    </button>
                  </div>
                </div>
              )}

              {account.status === AccountStatus.CLOSED && (
                <div className="account-overview__action-group">
                  <div className="account-overview__notice-banner account-overview__notice-banner--muted">
                    <strong>Account is Permanently Closed</strong>
                    <p>
                      This account has reached its terminal lifecycle state. No further
                      transactions or state changes may be executed. Historical audit
                      records remain preserved.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <FreezeConfirmDialog
        isOpen={isFreezeDialogOpen}
        onClose={() => setIsFreezeDialogOpen(false)}
        onConfirm={handleFreeze}
        accountName={account.accountName}
        accountNumber={account.accountNumber}
        isPending={isFreezePending}
      />

      <CloseConfirmDialog
        isOpen={isCloseDialogOpen}
        onClose={() => setIsCloseDialogOpen(false)}
        onConfirm={handleClose}
        accountName={account.accountName}
        accountNumber={account.accountNumber}
        isPending={isClosePending}
      />

      <style>{`
        .account-overview {
          width: 100%;
        }

        .account-overview__grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: var(--space-lg);
        }

        .account-overview__primary-col {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .account-overview__secondary-col {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .account-overview-card {
          background: var(--surface-card);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .account-overview-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-base) var(--space-lg);
          border-bottom: 1px solid var(--border-hairline);
          background: var(--surface-soft);
        }

        .account-overview-card__title {
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 600;
          color: var(--color-ink);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .account-overview__refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: var(--color-primary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-xs);
          transition: background-color 0.15s ease;
        }

        .account-overview__refresh-btn:hover:not(:disabled) {
          background: var(--color-primary-soft);
        }

        .account-overview__refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .account-overview__balance-container {
          padding: var(--space-xl) var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .account-overview__balance-display {
          font-size: 36px;
          font-weight: 700;
          color: var(--color-ink);
          font-variant-numeric: tabular-nums;
          line-height: 1.1;
        }

        .account-overview__currency-symbol {
          font-size: 24px;
          font-weight: 500;
          color: var(--color-muted);
        }

        .account-overview__balance-hint {
          margin: var(--space-xs) 0 0 0;
          max-width: 480px;
        }

        .account-overview__details-list {
          display: flex;
          flex-direction: column;
          margin: 0;
          padding: 0;
        }

        .account-overview__details-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-base) var(--space-lg);
          border-bottom: 1px solid var(--border-hairline-soft);
          font-size: 14px;
        }

        .account-overview__details-row:last-child {
          border-bottom: none;
        }

        .account-overview__dt {
          color: var(--color-muted);
          font-weight: 500;
        }

        .account-overview__dd {
          margin: 0;
          color: var(--color-ink);
          text-align: right;
        }

        .account-overview__type-chip {
          display: inline-block;
          padding: 2px 8px;
          background: var(--surface-soft);
          border: 1px solid var(--border-hairline);
          border-radius: var(--radius-xs);
          font-size: 12px;
          font-weight: 600;
        }

        .account-overview__lifecycle-body {
          padding: var(--space-lg);
        }

        .account-overview__action-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-base);
        }

        .account-overview__action-description {
          font-size: 14px;
          line-height: 1.4;
          margin: 0;
        }

        .account-overview__button-stack {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .account-overview__btn {
          height: 40px;
          padding: 0 18px;
          border-radius: var(--radius-pill);
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease, opacity 0.15s ease;
        }

        .account-overview__btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .account-overview__btn--primary {
          background: var(--color-primary);
          color: #ffffff;
        }

        .account-overview__btn--primary:hover:not(:disabled) {
          background: var(--color-primary-active);
        }

        .account-overview__btn--warning {
          background: var(--surface-warning-soft);
          color: var(--color-warning);
          border: 1px solid #fde68a;
        }

        .account-overview__btn--warning:hover:not(:disabled) {
          background: #fef3c7;
        }

        .account-overview__btn--destructive {
          background: var(--color-negative);
          color: #ffffff;
        }

        .account-overview__btn--destructive:hover:not(:disabled) {
          background: #b91c1c;
        }

        .account-overview__notice-banner {
          padding: var(--space-base);
          border-radius: var(--radius-md);
          font-size: 13px;
          line-height: 1.4;
        }

        .account-overview__notice-banner strong {
          display: block;
          margin-bottom: 4px;
        }

        .account-overview__notice-banner p {
          margin: 0;
        }

        .account-overview__notice-banner--warning {
          background: var(--surface-warning-soft);
          border: 1px solid #fde68a;
          color: var(--color-warning);
        }

        .account-overview__notice-banner--muted {
          background: var(--surface-soft);
          border: 1px solid var(--border-hairline);
          color: var(--color-muted);
        }

        .account-overview__spin {
          animation: spin 1s linear infinite;
        }

        .account-overview__loading-inline {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 800px) {
          .account-overview__grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
