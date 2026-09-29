/**
 * WithdrawalModal Component
 *
 * Modal dialog for withdrawing funds from an ACTIVE account via POST /accounts/{id}/withdrawal.
 *
 * CRITICAL FINANCIAL INVARIANTS:
 *   - The frontend must NEVER compare the withdrawal amount against cached balance to block submission.
 *     The backend database lock and balance computation is the sole authority for sufficient funds.
 *   - Withdrawal is a standard financial operation, NOT a destructive administrative action.
 *     Submit button uses standard primary styling (--color-primary), NEVER destructive red (DESIGN.md §9, §28.2).
 *   - Client pre-flight validation verifies decimal format and bounds (> 0.00, <= 17 integer digits, <= 2 decimals).
 *   - Wire serialization via Money.toWireString().
 *   - Response amount formatting strictly via Money.fromWire().format(). Zero Number()/parseFloat().
 *   - Zero optimistic balance updates.
 *
 * Source: DESIGN.md §9, §16, §28.2; FRONTEND_PRD.md §9.2; FRONTEND_ARCHITECTURE.md §8, §14
 */
import React, { useState } from 'react'
import { ModalDialog } from '@/components/overlay/ModalDialog'
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner'
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay'
import { TechnicalIdBadge } from '@/components/typography/TechnicalIdBadge'
import { useWithdrawal } from '../api/transactionMutations'
import { useAccounts } from '@/features/accounts/api/accountQueries'
import { AccountStatus } from '@/types/enums'
import { useToast } from '@/hooks/useToast'
import { validateMonetaryAmount } from '@/utils/validation'
import { Money } from '@/utils/money'
import { isApiError, type ApiError } from '@/api/errors'
import type { AccountResponse } from '@/features/accounts/types/account'

export interface WithdrawalModalProps {
  isOpen: boolean
  onClose: () => void
  account?: AccountResponse | undefined
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  account,
}) => {
  const toast = useToast()
  const { mutateAsync: withdraw, isPending } = useWithdrawal()

  // In Dashboard mode (account is undefined), fetch candidate active accounts
  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts(
    {
      status: AccountStatus.ACTIVE,
      size: 100,
    },
    { enabled: Boolean(isOpen && !account) }
  )

  const eligibleAccounts = (accountsData?.content ?? []).filter(
    (acc) => acc.accountNumber !== 'SYS-CASH' && acc.status === AccountStatus.ACTIVE
  )

  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [accountError, setAccountError] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<ApiError | Error | null>(null)

  const effectiveAccount = account ?? eligibleAccounts.find((acc) => String(acc.id) === selectedAccountId)

  const resetForm = () => {
    setSelectedAccountId('')
    setAccountError(null)
    setAmount('')
    setFieldError(null)
    setServerError(null)
  }

  const handleClose = () => {
    if (isPending) return
    resetForm()
    onClose()
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
    if (fieldError) {
      setFieldError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return

    setServerError(null)

    let hasError = false
    if (!effectiveAccount) {
      setAccountError('Please select a source account')
      hasError = true
    }

    const validation = validateMonetaryAmount(amount)
    if (!validation.isValid || !validation.money) {
      setFieldError(validation.error ?? 'Please enter a valid amount')
      hasError = true
    }

    if (hasError || !effectiveAccount || !validation.money) {
      return
    }

    try {
      const data = await withdraw({
        accountId: effectiveAccount.id,
        amount: validation.money.toWireString(),
      })

      const formattedAmount = Money.fromWire(data.amount).format()
      toast.success(
        'Withdrawal Successful',
        `Withdrawal of ₹${formattedAmount} completed. Reference: ${data.referenceNumber}`
      )

      handleClose()
    } catch (err: unknown) {
      if (isApiError(err)) {
        setServerError(err)
      } else if (err instanceof Error) {
        setServerError(err)
      } else {
        setServerError(new Error('An unexpected error occurred while processing the withdrawal.'))
      }
    }
  }

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Withdraw Funds"
      maxWidth="480px"
    >
      <form onSubmit={handleSubmit} className="monetary-form" noValidate>
        {serverError !== null && (
          <div className="monetary-form__error-banner" data-testid="withdrawal-error-banner">
            <ErrorDisplay error={serverError} compact />
          </div>
        )}

        {account ? (
          <div className="monetary-form__context-box">
            <div className="monetary-form__context-row">
              <span className="monetary-form__context-label">Source Account</span>
              <span className="monetary-form__context-name font-medium">{account.accountName}</span>
            </div>
            <div className="monetary-form__context-row">
              <span className="monetary-form__context-label">Account Number</span>
              <TechnicalIdBadge id={account.accountNumber} label="Source Account Number" />
            </div>
          </div>
        ) : (
          <div className="monetary-form__field">
            <label htmlFor="withdrawal-source-account" className="monetary-form__label">
              Source Account <span className="monetary-form__required">*</span>
            </label>
            {isLoadingAccounts ? (
              <div className="monetary-form__loading-accounts text-muted">
                <LoadingSpinner size="sm" label="Loading active accounts..." />
                <span>Loading active accounts...</span>
              </div>
            ) : (
              <select
                id="withdrawal-source-account"
                data-testid="withdrawal-account-select"
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value)
                  if (accountError) setAccountError(null)
                }}
                disabled={isPending}
                className={`monetary-form__select ${accountError ? 'monetary-form__select--error' : ''}`}
                aria-invalid={Boolean(accountError)}
                aria-describedby={accountError ? 'withdrawal-account-error' : undefined}
              >
                <option value="">Select source account</option>
                {eligibleAccounts.map((acc) => (
                  <option key={acc.id} value={String(acc.id)}>
                    {acc.accountNumber} — {acc.accountName}
                  </option>
                ))}
              </select>
            )}
            {accountError && (
              <p id="withdrawal-account-error" className="monetary-form__field-error" role="alert">
                {accountError}
              </p>
            )}
          </div>
        )}

        <div className="monetary-form__field">
          <label htmlFor="withdrawal-amount" className="monetary-form__label">
            Withdrawal Amount <span className="monetary-form__required">*</span>
          </label>

          <div
            className={`monetary-form__input-wrapper ${
              fieldError ? 'monetary-form__input-wrapper--error' : ''
            }`}
          >
            <span className="monetary-form__currency-prefix" aria-hidden="true">
              ₹
            </span>
            <input
              id="withdrawal-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              disabled={isPending}
              placeholder="0.00"
              className="monetary-form__input font-mono"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={
                fieldError ? 'withdrawal-amount-error' : 'withdrawal-amount-hint'
              }
              autoFocus
            />
          </div>

          {fieldError ? (
            <p id="withdrawal-amount-error" className="monetary-form__field-error" role="alert">
              {fieldError}
            </p>
          ) : (
            <p id="withdrawal-amount-hint" className="monetary-form__hint text-caption text-muted">
              Minimum ₹0.01. Maximum 17 integer digits and 2 decimal places.
            </p>
          )}
        </div>

        <div className="monetary-form__actions">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="monetary-form__btn monetary-form__btn--secondary"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="monetary-form__btn monetary-form__btn--primary"
            data-testid="withdrawal-submit-button"
          >
            {isPending ? (
              <span className="monetary-form__loading-inline">
                <LoadingSpinner size="sm" label="Processing withdrawal..." />
                <span>Withdrawing...</span>
              </span>
            ) : (
              'Withdraw Funds'
            )}
          </button>
        </div>

        <style>{`
          .monetary-form {
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
          }

          .monetary-form__error-banner {
            margin-bottom: var(--space-xs);
          }

          .monetary-form__context-box {
            background: var(--surface-soft);
            border: 1px solid var(--border-hairline);
            border-radius: var(--radius-md);
            padding: var(--space-sm) var(--space-base);
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .monetary-form__context-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .monetary-form__context-label {
            font-size: 13px;
            color: var(--color-muted);
          }

          .monetary-form__context-name {
            font-size: 14px;
            color: var(--color-ink);
          }

          .monetary-form__field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .monetary-form__label {
            font-size: 14px;
            font-weight: 500;
            color: var(--color-ink);
          }

          .monetary-form__select {
            height: 44px;
            padding: 10px 14px;
            border-radius: var(--radius-md);
            border: 1px solid var(--border-hairline);
            background: var(--surface-card);
            font-size: 15px;
            color: var(--color-ink);
            outline: none;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
          }

          .monetary-form__select:focus {
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px var(--color-primary-soft);
          }

          .monetary-form__select--error {
            border-color: var(--color-negative) !important;
          }

          .monetary-form__select:disabled {
            background: var(--surface-soft);
            color: var(--color-muted);
            cursor: not-allowed;
          }

          .monetary-form__loading-accounts {
            display: flex;
            align-items: center;
            gap: 8px;
            height: 44px;
            font-size: 14px;
          }

          .monetary-form__input-wrapper {
            display: flex;
            align-items: center;
            border: 1px solid var(--border-hairline);
            border-radius: var(--radius-md);
            background: var(--surface-card);
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
          }

          .monetary-form__input-wrapper:focus-within {
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px var(--color-primary-soft);
          }

          .monetary-form__input-wrapper--error {
            border-color: var(--color-negative) !important;
          }

          .monetary-form__currency-prefix {
            padding-left: 14px;
            font-size: 16px;
            font-weight: 600;
            color: var(--color-muted);
            user-select: none;
          }

          .monetary-form__input {
            width: 100%;
            height: 44px;
            padding: 10px 14px 10px 8px;
            border: none;
            background: transparent;
            font-size: 16px;
            color: var(--color-ink);
            outline: none;
          }

          .monetary-form__input:disabled {
            color: var(--color-muted);
            cursor: not-allowed;
          }

          .monetary-form__field-error {
            font-size: 13px;
            color: var(--color-negative);
            margin: 0;
          }

          .monetary-form__hint {
            margin: 0;
            font-size: 12px;
          }

          .monetary-form__actions {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 12px;
            padding-top: var(--space-base);
            border-top: 1px solid var(--border-hairline);
            margin-top: var(--space-xs);
          }

          .monetary-form__btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 40px;
            padding: 0 20px;
            font-family: var(--font-ui);
            font-size: 14px;
            font-weight: 600;
            border-radius: var(--radius-pill);
            cursor: pointer;
            transition: background-color 0.15s ease, border-color 0.15s ease;
            text-decoration: none;
          }

          .monetary-form__btn:disabled {
            cursor: not-allowed;
            opacity: 0.65;
          }

          .monetary-form__btn--secondary {
            background: transparent;
            border: 1px solid var(--border-hairline);
            color: var(--color-body);
          }

          .monetary-form__btn--secondary:hover:not(:disabled) {
            background: var(--surface-soft);
            color: var(--color-ink);
          }

          .monetary-form__btn--primary {
            background: var(--color-primary);
            border: 1px solid var(--color-primary);
            color: #ffffff;
          }

          .monetary-form__btn--primary:hover:not(:disabled) {
            background: var(--color-primary-active);
            border-color: var(--color-primary-active);
          }

          .monetary-form__loading-inline {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
        `}</style>
      </form>
    </ModalDialog>
  )
}
