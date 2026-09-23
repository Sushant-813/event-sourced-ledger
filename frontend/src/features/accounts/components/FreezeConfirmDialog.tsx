/**
 * FreezeConfirmDialog Component
 *
 * Confirmation modal for freezing an ACTIVE account.
 * Explains operational impact (suspension of transactions).
 */
import React from 'react'
import { ConfirmDialog } from '@/components/overlay/ConfirmDialog'

export interface FreezeConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  accountName: string
  accountNumber: string
  isPending?: boolean
}

export const FreezeConfirmDialog: React.FC<FreezeConfirmDialogProps> = ({
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
      title="Freeze Account"
      confirmLabel="Freeze Account"
      isPending={isPending}
      variant="default"
      description={
        <div className="freeze-dialog-desc">
          <p>
            Are you sure you want to freeze <strong>{accountName}</strong> (
            <code>{accountNumber}</code>)?
          </p>
          <p className="freeze-dialog-desc__notice">
            Freezing will immediately suspend deposits, withdrawals, and outgoing
            transfers. The account may be reactivated at any time by an authorized
            operator.
          </p>
          <style>{`
            .freeze-dialog-desc {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .freeze-dialog-desc__notice {
              color: var(--color-muted);
              font-size: 13px;
              line-height: 1.4;
            }
          `}</style>
        </div>
      }
    />
  )
}
