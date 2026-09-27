/**
 * TransferModal Component
 *
 * Modal dialog for transferring funds between two ACTIVE accounts via POST /transfers.
 *
 * CRITICAL FINANCIAL INVARIANTS:
 *   - Source account is fixed from the active account context.
 *   - Destination accounts list contains ONLY ACTIVE customer accounts.
 *   - SYS-CASH is NEVER exposed or selectable as a customer account.
 *   - Source account is strictly excluded from destination options (source != destination).
 *   - Zero client-side balance calculations or optimistic balance updates.
 *   - Wire amount serialized via Money.toWireString().
 *   - Inbound response amount ingested via Money.fromWire(response.amount).format().
 *   - Post-mutation cache invalidation triggers authoritative balance refetch for
 *     BOTH source and destination accounts.
 *
 * Source: DESIGN.md §16, FRONTEND_PRD.md §9.3, FRONTEND_ARCHITECTURE.md §11.3, §14
 */
import React, { useState } from 'react'
import { ModalDialog } from '@/components/overlay/ModalDialog'
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner'
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay'
import { TechnicalIdBadge } from '@/components/typography/TechnicalIdBadge'
import { useTransfer } from '../api/transactionMutations'
import { useAccounts } from '@/features/accounts/api/accountQueries'
import { useToast } from '@/hooks/useToast'
import { validateMonetaryAmount } from '@/utils/validation'
import { Money } from '@/utils/money'
import { isApiError, type ApiError } from '@/api/errors'
import { AccountStatus } from '@/types/enums'
import type { AccountResponse } from '@/features/accounts/types/account'

export interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  account: AccountResponse
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  account,
}) => {
  const toast = useToast()
  const { mutateAsync: transfer, isPending } = useTransfer()

  // Fetch candidate destination accounts (ACTIVE accounts only)
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    error: accountsError,
  } = useAccounts({
    status: AccountStatus.ACTIVE,
    size: 100,
  })

  const [destinationAccountId, setDestinationAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    destinationAccountId?: string
    amount?: string
  }>({})
  const [serverError, setServerError] = useState<ApiError | Error | null>(null)

  // Filter destination candidates: exclude SYS-CASH and source account
  const eligibleDestinationAccounts = (accountsData?.content ?? []).filter(
    (acc) =>
      acc.accountNumber !== 'SYS-CASH' &&
      acc.id !== account.id &&
      acc.status === AccountStatus.ACTIVE
  )

  const selectedDestinationAccount = eligibleDestinationAccounts.find(
    (acc) => String(acc.id) === destinationAccountId
  )

  const resetForm = () => {
    setDestinationAccountId('')
    setAmount('')
    setFieldErrors({})
    setServerError(null)
  }

  const handleClose = () => {
    if (isPending) return
    resetForm()
    onClose()
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
    if (fieldErrors.amount) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.amount
        return next
      })
    }
  }

  const handleDestinationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDestinationAccountId(e.target.value)
    if (fieldErrors.destinationAccountId) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.destinationAccountId
        return next
      })
    }
  }

  const validate = (): { isValid: boolean; money?: Money } => {
    const errors: { destinationAccountId?: string; amount?: string } = {}

    if (!destinationAccountId) {
      errors.destinationAccountId = 'Destination account is required'
    } else if (String(account.id) === destinationAccountId) {
      errors.destinationAccountId = 'Source and destination accounts must be different'
    }

    const amountValidation = validateMonetaryAmount(amount)
    if (!amountValidation.isValid || !amountValidation.money) {
      errors.amount = amountValidation.error ?? 'Please enter a valid amount'
    }

    setFieldErrors(errors)
    const isValid = Object.keys(errors).length === 0
    if (isValid && amountValidation.money) {
      return { isValid: true, money: amountValidation.money }
    }
    return { isValid: false }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return

    setServerError(null)

    const { isValid, money } = validate()
    if (!isValid || !money) return

    try {
      const data = await transfer({
        sourceAccountId: account.id,
        destinationAccountId: Number(destinationAccountId),
        amount: money.toWireString(),
      })

      const formattedAmount = Money.fromWire(data.amount).format()
      toast.success(
        'Transfer Successful',
        `Transfer of ₹${formattedAmount} completed. Reference: ${data.referenceNumber}`
      )

      handleClose()
    } catch (err: unknown) {
      if (isApiError(err)) {
        setServerError(err)
      } else if (err instanceof Error) {
        setServerError(err)
      } else {
        setServerError(new Error('An unexpected error occurred while processing the transfer.'))
      }
    }
  }

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Transfer Funds"
      maxWidth="520px"
    >
      <form onSubmit={handleSubmit} className="monetary-form" noValidate>
        {serverError !== null && (
          <div className="monetary-form__error-banner" data-testid="transfer-error-banner">
            <ErrorDisplay error={serverError} compact />
          </div>
        )}

        {/* Source Account Context */}
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

        {/* Destination Account Selector */}
        <div className="monetary-form__field">
          <label htmlFor="transfer-destination" className="monetary-form__label">
            Destination Account <span className="monetary-form__required">*</span>
          </label>

          {isLoadingAccounts ? (
            <div className="monetary-form__loading-accounts text-muted">
              <LoadingSpinner size="sm" label="Loading eligible accounts..." />
              <span>Loading eligible accounts...</span>
            </div>
          ) : accountsError ? (
            <p className="monetary-form__field-error" role="alert">
              Failed to load accounts. Please try reopening the modal.
            </p>
          ) : (
            <select
              id="transfer-destination"
              value={destinationAccountId}
              onChange={handleDestinationChange}
              disabled={isPending}
              className={`monetary-form__select ${
                fieldErrors.destinationAccountId ? 'monetary-form__select--error' : ''
              }`}
              aria-invalid={Boolean(fieldErrors.destinationAccountId)}
              aria-describedby={
                fieldErrors.destinationAccountId ? 'transfer-destination-error' : undefined
              }
              autoFocus
            >
              <option value="">Select destination account...</option>
              {eligibleDestinationAccounts.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.accountNumber} — {dest.accountName}
                </option>
              ))}
            </select>
          )}

          {fieldErrors.destinationAccountId && (
            <p
              id="transfer-destination-error"
              className="monetary-form__field-error"
              role="alert"
            >
              {fieldErrors.destinationAccountId}
            </p>
          )}
        </div>

        {/* Amount Field */}
        <div className="monetary-form__field">
          <label htmlFor="transfer-amount" className="monetary-form__label">
            Transfer Amount <span className="monetary-form__required">*</span>
          </label>

          <div
            className={`monetary-form__input-wrapper ${
              fieldErrors.amount ? 'monetary-form__input-wrapper--error' : ''
            }`}
          >
            <span className="monetary-form__currency-prefix" aria-hidden="true">
              ₹
            </span>
            <input
              id="transfer-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              disabled={isPending}
              placeholder="0.00"
              className="monetary-form__input font-mono"
              aria-invalid={Boolean(fieldErrors.amount)}
              aria-describedby={
                fieldErrors.amount ? 'transfer-amount-error' : 'transfer-amount-hint'
              }
            />
          </div>

          {fieldErrors.amount ? (
            <p id="transfer-amount-error" className="monetary-form__field-error" role="alert">
              {fieldErrors.amount}
            </p>
          ) : (
            <p id="transfer-amount-hint" className="monetary-form__hint text-caption text-muted">
              Minimum ₹0.01. Maximum 17 integer digits and 2 decimal places.
            </p>
          )}
        </div>

        {/* Review Summary (shown when destination is selected) */}
        {selectedDestinationAccount && (
          <div className="monetary-form__review-box">
            <span className="monetary-form__review-title">Transfer Summary</span>
            <div className="monetary-form__review-row">
              <span className="text-muted">From:</span>
              <span className="font-mono">{account.accountNumber}</span>
            </div>
            <div className="monetary-form__review-row">
              <span className="text-muted">To:</span>
              <span className="font-mono">{selectedDestinationAccount.accountNumber}</span>
            </div>
          </div>
        )}

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
            data-testid="transfer-submit-button"
          >
            {isPending ? (
              <span className="monetary-form__loading-inline">
                <LoadingSpinner size="sm" label="Processing transfer..." />
                <span>Transferring...</span>
              </span>
            ) : (
              'Transfer Funds'
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

          .monetary-form__required {
            color: var(--color-negative);
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

          .monetary-form__review-box {
            background: var(--surface-soft);
            border: 1px dashed var(--border-hairline);
            border-radius: var(--radius-md);
            padding: var(--space-sm) var(--space-base);
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .monetary-form__review-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--color-muted);
            margin-bottom: 2px;
          }

          .monetary-form__review-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
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
