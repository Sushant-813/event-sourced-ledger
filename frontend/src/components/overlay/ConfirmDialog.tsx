/**
 * ConfirmDialog Component
 *
 * Specialized modal dialog for user confirmation of critical or terminal actions.
 * Supports default (accent blue) and destructive (negative red) action variants.
 * Follows DESIGN.md §9.3 and §16.
 */
import React from 'react'
import { ModalDialog } from './ModalDialog'
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  isPending?: boolean
  variant?: 'default' | 'destructive'
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isPending = false,
  variant = 'default',
}) => {
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={() => {
        if (!isPending) onClose()
      }}
      title={title}
      maxWidth="420px"
    >
      <div className="confirm-dialog-content">
        <div className="confirm-dialog-description">{description}</div>

        <div className="confirm-dialog-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="confirm-dialog-btn confirm-dialog-btn--secondary"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`confirm-dialog-btn ${
              variant === 'destructive'
                ? 'confirm-dialog-btn--destructive'
                : 'confirm-dialog-btn--primary'
            }`}
          >
            {isPending ? (
              <span className="confirm-dialog-loading">
                <LoadingSpinner size="sm" />
                <span>Processing...</span>
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>

      <style>{`
        .confirm-dialog-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .confirm-dialog-description {
          font-family: var(--font-ui);
          font-size: 14px;
          color: var(--color-body);
          line-height: 1.5;
        }

        .confirm-dialog-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-sm);
          padding-top: var(--space-base);
          border-top: 1px solid var(--border-hairline);
        }

        .confirm-dialog-btn {
          height: 40px;
          padding: 0 20px;
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

        .confirm-dialog-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .confirm-dialog-btn--secondary {
          background: var(--surface-strong);
          color: var(--color-ink);
        }

        .confirm-dialog-btn--secondary:hover:not(:disabled) {
          background: #e2e5e9;
        }

        .confirm-dialog-btn--primary {
          background: var(--color-primary);
          color: #ffffff;
        }

        .confirm-dialog-btn--primary:hover:not(:disabled) {
          background: var(--color-primary-active);
        }

        .confirm-dialog-btn--destructive {
          background: var(--color-negative);
          color: #ffffff;
        }

        .confirm-dialog-btn--destructive:hover:not(:disabled) {
          background: #b91c1c;
        }

        .confirm-dialog-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        .confirm-dialog-loading {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </ModalDialog>
  )
}
