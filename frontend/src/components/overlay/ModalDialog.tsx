/**
 * ModalDialog Component
 *
 * Accessible modal dialog using React Portal per DESIGN.md §16.
 * Implements keyboard focus trapping, Escape key closing, backdrop click dismissal,
 * and body scroll locking.
 */
import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface ModalDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
  className?: string
}

export const ModalDialog: React.FC<ModalDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '480px',
  className = '',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  // Manage body scroll locking and focus restoration
  useEffect(() => {
    if (!isOpen) return

    previousActiveElementRef.current = document.activeElement as HTMLElement
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the dialog container or first focusable element
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length > 0) {
          focusable[0]?.focus()
        } else {
          dialogRef.current.focus()
        }
      }
    }, 50)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = originalOverflow
      previousActiveElementRef.current?.focus()
    }
  }, [isOpen])

  // Handle keyboard navigation (Escape to close, Tab to trap focus)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const firstElement = focusable[0]
        const lastElement = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={dialogRef}
        className={`modal-container ${className}`.trim()}
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-dialog-title"
        tabIndex={-1}
      >
        <header className="modal-header">
          <h2 id="modal-dialog-title" className="modal-title">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close dialog"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="modal-body">{children}</div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(10, 11, 13, 0.45);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-base);
          animation: modalFadeIn 0.15s ease-out;
        }

        .modal-container {
          background: var(--surface-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-elevated), 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--border-hairline);
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          outline: none;
          animation: modalScaleUp 0.15s ease-out;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-md) var(--space-lg);
          border-bottom: 1px solid var(--border-hairline);
        }

        .modal-title {
          font-family: var(--font-ui);
          font-size: 18px;
          font-weight: 600;
          color: var(--color-ink);
          margin: 0;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: var(--color-muted);
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .modal-close-btn:hover {
          background: var(--surface-soft);
          color: var(--color-ink);
        }

        .modal-close-btn:focus-visible {
          outline: 2px solid var(--color-primary);
        }

        .modal-body {
          padding: var(--space-lg);
          overflow-y: auto;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalScaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  )
}
