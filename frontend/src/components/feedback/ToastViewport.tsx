/**
 * ToastViewport Component
 *
 * Fixed container positioned in the top-right corner of the viewport
 * to host toast notifications. Connected to aria-live polite region for screen readers.
 */
import React from 'react'
import { Toast, type ToastItem } from './Toast'

export interface ToastViewportProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export const ToastViewport: React.FC<ToastViewportProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null

  return (
    <div
      className="toast-viewport"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}

      <style>{`
        .toast-viewport {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
          max-height: calc(100vh - 40px);
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
