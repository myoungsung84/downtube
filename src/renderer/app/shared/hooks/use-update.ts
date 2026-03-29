import { useContext } from 'react'

import type { UpdateContextValue } from '../providers/update/update-context'
import { updateContext } from '../providers/update/update-context'

export function useUpdate(): UpdateContextValue {
  const ctx = useContext(updateContext)

  if (!ctx) {
    throw new Error('useUpdate must be used within UpdateProvider')
  }

  return ctx
}
