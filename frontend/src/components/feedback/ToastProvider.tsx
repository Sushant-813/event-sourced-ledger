/**
 * ToastProvider & ToastContext
 *
 * Context provider managing toast state and rendering the ToastViewport.
 * Provides helper dispatch methods for success, error, warning, and info notifications.
 */
import React, { createContext, useCallback, useState } from 'react'
import { ToastViewport } from './ToastViewport'
import type { ToastItem, ToastVariant } from './Toast'

export interface ToastContextValue {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => string
  dismissToast: (id: string) => void
  success: (title: string, message?: string) => string
  error: (title: string, message?: string) => string
  warning: (title: string, message?: string) => string
  info: (title: string, message?: string) => string
}

export const ToastContext = createContext<ToastContextValue | null>(null)

let toastIdCounter = 0

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    ({
      variant,
      title,
      message,
    }: {
      variant: ToastVariant
      title: string
      message?: string
    }): string => {
      toastIdCounter += 1
      const id = `toast-${Date.now()}-${toastIdCounter}`
      const newToast: ToastItem = {
        id,
        variant,
        title,
        ...(message !== undefined ? { message } : {}),
      }
      setToasts((prev) => [...prev, newToast])
      return id
    },
    []
  )

  const success = useCallback(
    (title: string, message?: string) =>
      addToast({
        variant: 'success',
        title,
        ...(message !== undefined ? { message } : {}),
      }),
    [addToast]
  )

  const error = useCallback(
    (title: string, message?: string) =>
      addToast({
        variant: 'error',
        title,
        ...(message !== undefined ? { message } : {}),
      }),
    [addToast]
  )

  const warning = useCallback(
    (title: string, message?: string) =>
      addToast({
        variant: 'warning',
        title,
        ...(message !== undefined ? { message } : {}),
      }),
    [addToast]
  )

  const info = useCallback(
    (title: string, message?: string) =>
      addToast({
        variant: 'info',
        title,
        ...(message !== undefined ? { message } : {}),
      }),
    [addToast]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        dismissToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}
