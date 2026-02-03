import { useContext } from 'react'

import { ToastContext } from '../providers/toast/toast.context'
import type { ToastContextValue } from '../providers/toast/toast.types'

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)

  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }

  return ctx
}
