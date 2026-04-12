import type { LibraryItem } from '@src/types/library.types'
import dayjs from 'dayjs'

export type LibrarySortKey =
  | 'downloadedAt-desc'
  | 'downloadedAt-asc'
  | 'title-asc'
  | 'fileSize-desc'

export type LibrarySortOption = {
  key: LibrarySortKey
  labelKey: 'sort.latest' | 'sort.oldest' | 'sort.title' | 'sort.size'
}

export const DEFAULT_LIBRARY_SORT_KEY: LibrarySortKey = 'downloadedAt-desc'

export const LIBRARY_SORT_OPTIONS: readonly LibrarySortOption[] = [
  { key: 'downloadedAt-desc', labelKey: 'sort.latest' },
  { key: 'downloadedAt-asc', labelKey: 'sort.oldest' },
  { key: 'title-asc', labelKey: 'sort.title' },
  { key: 'fileSize-desc', labelKey: 'sort.size' }
] as const

const titleCollator = new Intl.Collator(['ko', 'en'], {
  numeric: true,
  sensitivity: 'base'
})

function toSafeNumber(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function getSafeCreatedAt(item: Partial<LibraryItem>): number {
  return toSafeNumber(item.createdAt)
}

function getSafeDownloadedAt(item: Partial<LibraryItem>): number {
  if (!item.downloadedAt) return 0

  const parsed = dayjs(item.downloadedAt)
  return parsed.isValid() ? parsed.valueOf() : 0
}

function getSafePrimaryDate(item: Partial<LibraryItem>): number {
  return getSafeDownloadedAt(item) || getSafeCreatedAt(item)
}

function getSafeFileSize(item: Partial<LibraryItem>): number {
  return toSafeNumber(item.fileSize)
}

function getSafeTitleText(item: Partial<LibraryItem>): string {
  return item.title?.trim() || item.fileName?.trim() || ''
}

function getSafeFileNameText(item: Partial<LibraryItem>): string {
  return item.fileName?.trim() || ''
}

function compareAsc(left: number, right: number): number {
  return left - right
}

function compareDesc(left: number, right: number): number {
  return right - left
}

function compareText(left: string, right: string): number {
  return titleCollator.compare(left, right)
}

function compareStableText(left: Partial<LibraryItem>, right: Partial<LibraryItem>): number {
  return (
    compareText(getSafeTitleText(left), getSafeTitleText(right)) ||
    compareText(getSafeFileNameText(left), getSafeFileNameText(right))
  )
}

function compareBySortKey(left: LibraryItem, right: LibraryItem, sortKey: LibrarySortKey): number {
  switch (sortKey) {
    case 'downloadedAt-desc':
      return (
        compareDesc(getSafePrimaryDate(left), getSafePrimaryDate(right)) ||
        compareDesc(getSafeCreatedAt(left), getSafeCreatedAt(right)) ||
        compareStableText(left, right)
      )

    case 'downloadedAt-asc':
      return (
        compareAsc(getSafePrimaryDate(left), getSafePrimaryDate(right)) ||
        compareAsc(getSafeCreatedAt(left), getSafeCreatedAt(right)) ||
        compareStableText(left, right)
      )

    case 'title-asc':
      return (
        compareText(getSafeTitleText(left), getSafeTitleText(right)) ||
        compareDesc(getSafeCreatedAt(left), getSafeCreatedAt(right)) ||
        compareStableText(left, right)
      )

    case 'fileSize-desc':
      return (
        compareDesc(getSafeFileSize(left), getSafeFileSize(right)) ||
        compareDesc(getSafeCreatedAt(left), getSafeCreatedAt(right)) ||
        compareStableText(left, right)
      )

    default:
      return 0
  }
}

export function sortLibraryItems(
  items: readonly LibraryItem[],
  sortKey: LibrarySortKey
): LibraryItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      return compareBySortKey(left.item, right.item, sortKey) || left.index - right.index
    })
    .map(({ item }) => item)
}
