import type { AppResult } from './error.types'

export type LibraryItemType = 'video' | 'audio'

export const librarySortKeys = [
  'downloadedAt-desc',
  'downloadedAt-asc',
  'title-asc',
  'fileSize-desc'
] as const

export type LibrarySortKey = (typeof librarySortKeys)[number]

export const DEFAULT_LIBRARY_SORT_KEY: LibrarySortKey = 'downloadedAt-desc'

export function isLibrarySortKey(value: unknown): value is LibrarySortKey {
  return typeof value === 'string' && librarySortKeys.includes(value as LibrarySortKey)
}

export type LibraryItem = {
  id: string
  type: LibraryItemType
  fileName: string
  filePath: string
  fileSize: number
  createdAt: number
  downloadedAt?: string
  title?: string
  uploader?: string
  thumbnailPath?: string
  jsonPath?: string
  extension: string
}

export type ListLibraryItemsResult = AppResult<{
  items: LibraryItem[]
}>
