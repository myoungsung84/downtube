import { useContext } from 'react'

import { DialogContext } from '../providers/dialog/dialog-context'
import type { DialogContextValue } from '../providers/dialog/dialog-types'

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext)

  if (!ctx) {
    throw new Error('useDialog must be used within DialogProvider')
  }

  return ctx
}
