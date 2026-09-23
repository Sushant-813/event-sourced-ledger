/**
 * CloseConfirmDialog Component
 *
 * Confirmation modal for permanently closing an account.
 * Follows DESIGN.md §9.3 (destructive button) and §16.
 *
 * Explains that closing an account is irreversible and terminal.
 */
import React from 'react'
import { ConfirmDialog } from '@/components/overlay/ConfirmDialog'

export interface CloseConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  accountName: string
  accountNumber: string
  isPending?: boolean
}

export const CloseConfirmDialog: React.FC<CloseConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  accountName,
  accountNumber,
  isPending = false,
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Close Account"
      confirmLabel="Close Account (Irreversible)"
      isPending={isPending}
      variant="destructive"
      description={
        <div className="close-dialog-desc">
          <p>
            Are you sure you want to permanently close <strong>{accountName}</strong> (
            <code>{accountNumber}</code>)?
          </p>
          <div className="close-dialog-desc__warning">
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
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              This is a terminal operation. Once closed, an account cannot be reopened,
              and no further transactions can be posted to it.
            </span>
          </div>
          <style>{`
            .close-dialog-desc {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .close-dialog-desc__warning {
              display: flex;
              align-items: flex-start;
              gap: 8px;
              padding: 10px 12px;
              background: var(--surface-error-soft);
              border: 1px solid #fecaca;
              border-radius: var(--radius-sm);
              color: var(--color-negative);
              font-size: 13px;
              line-height: 1.4;
            }
            .close-dialog-desc__warning svg {
              flex-shrink: 0;
              margin-top: 2px;
            }
          `}</style>
        </div>
      }
    />
  )
}
