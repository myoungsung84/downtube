import type { LibraryItem } from '@src/types/library.types'
import type { AppLanguage } from '@src/types/settings.types'

export type LibraryScreenLanguage = AppLanguage

export type LibraryMenuState =
  | { phase: 'idle' }
  | { phase: 'open'; anchorEl: HTMLElement; item: LibraryItem }

export type LibraryPlayerOpenState = {
  itemId: string
  at: number
}
