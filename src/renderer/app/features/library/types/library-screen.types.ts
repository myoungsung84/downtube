import type { LibraryItem } from '@src/types/library.types'

export type LibraryScreenLanguage = 'ko' | 'en'

export type LibraryMenuState =
  | { phase: 'idle' }
  | { phase: 'open'; anchorEl: HTMLElement; item: LibraryItem }

export type LibraryPlayerOpenState = {
  itemId: string
  at: number
}
