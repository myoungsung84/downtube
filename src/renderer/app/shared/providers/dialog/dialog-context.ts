import { createContext } from 'react'

import type { DialogContextValue } from './dialog-types'

export const DialogContext = createContext<DialogContextValue | null>(null)
