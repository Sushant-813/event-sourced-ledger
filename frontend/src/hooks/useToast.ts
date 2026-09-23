/**
 * useToast Hook
 *
 * Provides access to the application toast notification context.
 */
import { useContext } from 'react'
import { ToastContext, type ToastContextValue } from '@/components/feedback/ToastProvider'

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
