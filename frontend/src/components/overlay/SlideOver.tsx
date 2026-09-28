/**
 * SlideOver Component
 *
 * Accessible slide-over drawer primitive using React Portal per DESIGN.md §16.
 * Implements keyboard focus trapping, Escape key dismissal, backdrop click dismissal,
 * and body scroll locking.
 */
import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface SlideOverProps {
  isOpen: boolean
  onClose: () => void
  title: React.ReactNode
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
  className?: string
  ariaLabel?: string
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = '540px',
  className = '',
  ariaLabel,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  // Manage body scroll locking and focus restoration
  useEffect(() => {
    if (!isOpen) return

    previousActiveElementRef.current = document.activeElement as HTMLElement
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the drawer container or first focusable element
    const timer = setTimeout(() => {
      if (drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length > 0) {
          focusable[0]?.focus()
        } else {
          drawerRef.current.focus()
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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }

    if (e.key === 'Tab' && drawerRef.current) {
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className={`slide-over-backdrop ${className}`.trim()}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      role="presentation"
    >
      <div
        ref={drawerRef}
        className="slide-over-panel"
        style={{ width, maxWidth: '100vw' }}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : ariaLabel ?? 'Drawer'}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <header className="slide-over-header">
          <div className="slide-over-header__text">
            {typeof title === 'string' ? (
              <h2 className="slide-over-title">{title}</h2>
            ) : (
              title
            )}
            {description && (
              <p className="slide-over-description text-muted">{description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="slide-over-close-btn"
            aria-label="Close drawer"
          >
            <svg
              width="20"
              height="20"
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

        {/* Content Body */}
        <div className="slide-over-body">{children}</div>

        {/* Optional Footer */}
        {footer && <footer className="slide-over-footer">{footer}</footer>}
      </div>

      <style>{`
        .slide-over-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 11, 13, 0.45);
          backdrop-filter: blur(2px);
          display: flex;
          justify-content: flex-end;
          z-index: 1000;
          animation: slide-over-fade-in 0.2s ease-out;
        }

        .slide-over-panel {
          height: 100%;
          background: var(--surface-card);
          box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          outline: none;
          animation: slide-over-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .slide-over-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-base) var(--space-lg);
          border-bottom: 1px solid var(--border-hairline);
          background: var(--surface-card);
          gap: var(--space-md);
        }

        .slide-over-header__text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .slide-over-title {
          font-family: var(--font-ui);
          font-size: 18px;
          font-weight: 600;
          color: var(--color-ink);
          margin: 0;
          line-height: 1.3;
        }

        .slide-over-description {
          font-family: var(--font-ui);
          font-size: 13px;
          margin: 0;
        }

        .slide-over-close-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          border-radius: var(--radius-sm);
          background: transparent;
          border: none;
          color: var(--color-muted);
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
          flex-shrink: 0;
        }

        .slide-over-close-btn:hover {
          background: var(--surface-soft);
          color: var(--color-ink);
        }

        .slide-over-close-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        .slide-over-body {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-lg);
        }

        .slide-over-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-sm);
          padding: var(--space-base) var(--space-lg);
          border-top: 1px solid var(--border-hairline);
          background: var(--surface-soft);
        }

        @keyframes slide-over-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-over-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>,
    document.body
  )
}
