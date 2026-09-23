/**
 * Toast Component
 *
 * Single toast notification card per DESIGN.md §17.
 * Uses distinctive semantic backgrounds, border, text color, and icons.
 * Auto-dismisses success/info/warning after 5s; error toasts persist until dismissed.
 */
import React, { useEffect } from 'react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  variant: ToastVariant
  title: string
  message?: string
}

export interface ToastProps {
  toast: ToastItem
  onDismiss: (id: string) => void
}

const VARIANT_CONFIG: Record<
  ToastVariant,
  { bg: string; border: string; color: string; icon: React.ReactNode }
> = {
  success: {
    bg: '#ecfdf5',
    border: '#a7f3d0',
    color: '#047857',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  error: {
    bg: '#fef2f2',
    border: '#fecaca',
    color: '#cf202f',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  warning: {
    bg: '#fffbeb',
    border: '#fde68a',
    color: '#b77900',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  info: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#0052ff',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const config = VARIANT_CONFIG[toast.variant]

  // Auto dismiss for non-error toasts after 5000ms
  useEffect(() => {
    if (toast.variant === 'error') return

    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.variant, onDismiss])

  return (
    <div
      className={`toast-item toast-item--${toast.variant}`}
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
      }}
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
    >
      <div
        className="toast-item__icon"
        style={{ color: config.color }}
        aria-hidden="true"
      >
        {config.icon}
      </div>

      <div className="toast-item__content">
        <h4 className="toast-item__title" style={{ color: config.color }}>
          {toast.title}
        </h4>
        {toast.message && <p className="toast-item__message">{toast.message}</p>}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="toast-item__close-btn"
        aria-label="Dismiss notification"
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
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <style>{`
        .toast-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          min-width: 300px;
          max-width: 420px;
          animation: toastSlideIn 0.2s ease-out;
          pointer-events: auto;
        }

        .toast-item__icon {
          flex-shrink: 0;
          margin-top: 2px;
          display: flex;
          align-items: center;
        }

        .toast-item__content {
          flex: 1;
          min-width: 0;
        }

        .toast-item__title {
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 2px 0;
        }

        .toast-item__message {
          font-family: var(--font-ui);
          font-size: 13px;
          color: var(--color-body);
          margin: 0;
          line-height: 1.4;
          word-break: break-word;
        }

        .toast-item__close-btn {
          background: transparent;
          border: none;
          color: var(--color-muted);
          cursor: pointer;
          padding: 2px;
          margin-left: 4px;
          border-radius: var(--radius-xs);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }

        .toast-item__close-btn:hover {
          color: var(--color-ink);
        }

        @keyframes toastSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
