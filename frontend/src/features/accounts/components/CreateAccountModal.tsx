/**
 * CreateAccountModal Component
 *
 * Modal form for creating a new ledger account via POST /accounts.
 *
 * VALIDATION CONTRACT (FRONTEND_ARCHITECTURE.md §9.1):
 *   - Client-side validation enforces non-blank values for accountNumber and accountName.
 *   - The regex format hint (^[A-Za-z0-9-_]{3,30}$) is displayed as hint text only
 *     and MUST NOT block submission, as the authoritative backend rule is @NotBlank.
 *   - Duplicate account numbers (HTTP 409) are caught and surfaced as inline field errors.
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModalDialog } from '@/components/overlay/ModalDialog'
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner'
import { ErrorDisplay } from '@/components/feedback/ErrorDisplay'
import { useCreateAccount } from '../api/accountMutations'
import { useToast } from '@/hooks/useToast'
import { ApiError, isApiError, isConflict } from '@/api/errors'
import { AccountType } from '@/types/enums'

export interface CreateAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const toast = useToast()
  const { mutateAsync: createAccount, isPending } = useCreateAccount()

  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState<AccountType>(AccountType.SAVINGS)

  const [fieldErrors, setFieldErrors] = useState<{
    accountNumber?: string
    accountName?: string
  }>({})
  const [serverError, setServerError] = useState<ApiError | Error | null>(null)

  const resetForm = () => {
    setAccountNumber('')
    setAccountName('')
    setAccountType(AccountType.SAVINGS)
    setFieldErrors({})
    setServerError(null)
  }

  const handleClose = () => {
    if (isPending) return
    resetForm()
    onClose()
  }

  const validate = (): boolean => {
    const errors: { accountNumber?: string; accountName?: string } = {}

    if (!accountNumber.trim()) {
      errors.accountNumber = 'Account number is required'
    }

    if (!accountName.trim()) {
      errors.accountName = 'Account name is required'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (!validate()) return

    try {
      const created = await createAccount({
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        accountType,
      })

      toast.success(
        'Account Created',
        `Account ${created.accountNumber} (${created.accountName}) was successfully created.`
      )

      handleClose()
      navigate(`/accounts/${created.id}/overview`)
    } catch (err: unknown) {
      if (isConflict(err)) {
        setFieldErrors((prev) => ({
          ...prev,
          accountNumber: 'This account number is already in use. Please choose another.',
        }))
      } else if (isApiError(err)) {
        setServerError(err)
      } else if (err instanceof Error) {
        setServerError(err)
      } else {
        setServerError(new Error('An unexpected error occurred while creating the account.'))
      }
    }
  }

  return (
    <ModalDialog isOpen={isOpen} onClose={handleClose} title="Create New Account" maxWidth="480px">
      <form onSubmit={handleSubmit} className="create-account-form" noValidate>
        {serverError !== null && (
          <div className="create-account-form__error-banner">
            <ErrorDisplay error={serverError} compact />
          </div>
        )}

        <div className="create-account-form__field">
          <label htmlFor="create-account-number" className="create-account-form__label">
            Account Number <span className="create-account-form__required">*</span>
          </label>
          <input
            id="create-account-number"
            type="text"
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value)
              if (fieldErrors.accountNumber) {
                setFieldErrors((prev) => {
                  const { accountNumber: _, ...rest } = prev
                  return rest
                })
              }
            }}
            placeholder="e.g. ACC-1001"
            disabled={isPending}
            className={`create-account-form__input font-mono ${
              fieldErrors.accountNumber ? 'create-account-form__input--error' : ''
            }`}
            autoComplete="off"
          />
          <span className="create-account-form__hint text-caption">
            Business account identifier (e.g. letters, numbers, hyphens).
          </span>
          {fieldErrors.accountNumber && (
            <span className="create-account-form__field-error" role="alert">
              {fieldErrors.accountNumber}
            </span>
          )}
        </div>

        <div className="create-account-form__field">
          <label htmlFor="create-account-name" className="create-account-form__label">
            Account Name <span className="create-account-form__required">*</span>
          </label>
          <input
            id="create-account-name"
            type="text"
            value={accountName}
            onChange={(e) => {
              setAccountName(e.target.value)
              if (fieldErrors.accountName) {
                setFieldErrors((prev) => {
                  const { accountName: _, ...rest } = prev
                  return rest
                })
              }
            }}
            placeholder="e.g. Treasury Operations"
            disabled={isPending}
            className={`create-account-form__input ${
              fieldErrors.accountName ? 'create-account-form__input--error' : ''
            }`}
          />
          {fieldErrors.accountName && (
            <span className="create-account-form__field-error" role="alert">
              {fieldErrors.accountName}
            </span>
          )}
        </div>

        <div className="create-account-form__field">
          <label htmlFor="create-account-type" className="create-account-form__label">
            Account Type <span className="create-account-form__required">*</span>
          </label>
          <select
            id="create-account-type"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as AccountType)}
            disabled={isPending}
            className="create-account-form__select"
          >
            <option value={AccountType.SAVINGS}>SAVINGS</option>
            <option value={AccountType.CURRENT}>CURRENT</option>
          </select>
        </div>

        <div className="create-account-form__actions">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="create-account-form__cancel-btn"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="create-account-form__submit-btn"
          >
            {isPending ? (
              <span className="create-account-form__btn-loading">
                <LoadingSpinner size="sm" />
                <span>Creating...</span>
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>

      <style>{`
        .create-account-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-base);
        }

        .create-account-form__error-banner {
          margin-bottom: var(--space-xs);
        }

        .create-account-form__field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .create-account-form__label {
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-ink);
        }

        .create-account-form__required {
          color: var(--color-negative);
        }

        .create-account-form__input,
        .create-account-form__select {
          height: 44px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-hairline);
          background: var(--surface-card);
          font-family: var(--font-ui);
          font-size: 14px;
          color: var(--color-ink);
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .create-account-form__input:focus-visible,
        .create-account-form__select:focus-visible {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-soft);
          outline: none;
        }

        .create-account-form__input--error {
          border-color: var(--color-negative);
        }

        .create-account-form__input--error:focus-visible {
          border-color: var(--color-negative);
          box-shadow: 0 0 0 3px var(--surface-error-soft);
        }

        .create-account-form__hint {
          color: var(--color-muted);
          font-size: 12px;
        }

        .create-account-form__field-error {
          color: var(--color-negative);
          font-size: 12px;
          font-weight: 500;
        }

        .create-account-form__actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-sm);
          padding-top: var(--space-base);
          border-top: 1px solid var(--border-hairline);
          margin-top: var(--space-xs);
        }

        .create-account-form__cancel-btn {
          height: 40px;
          padding: 0 20px;
          border-radius: var(--radius-pill);
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 600;
          background: var(--surface-strong);
          color: var(--color-ink);
          border: none;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .create-account-form__cancel-btn:hover:not(:disabled) {
          background: #e2e5e9;
        }

        .create-account-form__submit-btn {
          height: 40px;
          padding: 0 22px;
          border-radius: var(--radius-pill);
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 600;
          background: var(--color-primary);
          color: #ffffff;
          border: none;
          cursor: pointer;
          transition: background-color 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .create-account-form__submit-btn:hover:not(:disabled) {
          background: var(--color-primary-active);
        }

        .create-account-form__submit-btn:disabled,
        .create-account-form__cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .create-account-form__btn-loading {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </ModalDialog>
  )
}
