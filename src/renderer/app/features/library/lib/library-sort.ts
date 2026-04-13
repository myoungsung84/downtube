import {
  DEFAULT_LIBRARY_SORT_KEY,
  type LibraryItem,
  type LibrarySortKey
} from '@src/types/library.types'
import dayjs from 'dayjs'

export type LibrarySortOption = {
  key: LibrarySortKey
  labelKey: 'sort.latest' | 'sort.oldest' | 'sort.title' | 'sort.size'
}

export const LIBRARY_SORT_OPTIONS: readonly LibrarySortOption[] = [
  { key: 'downloadedAt-desc', labelKey: 'sort.latest' },
  { key: 'downloadedAt-asc', labelKey: 'sort.oldest' },
  { key: 'title-asc', labelKey: 'sort.title' },
  { key: 'fileSize-desc', labelKey: 'sort.size' }
] as const

export { DEFAULT_LIBRARY_SORT_KEY }

const titleCollator = new Intl.Collator(['ko', 'en'], {
  numeric: true,
  sensitivity: 'base'
})

function toSafeNumber(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

type DecoratedLibraryItem = {
  item: LibraryItem
  index: number
  primaryDate: number
  createdAt: number
  fileSize: number
  titleText: string
  fileNameText: string
}

function toSafeDownloadedAt(item: LibraryItem): number {
  if (!item.downloadedAt) return 0
  const parsed = dayjs(item.downloadedAt)
  return parsed.isValid() ? parsed.valueOf() : 0
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

function compareDecoratedBySortKey(
  left: DecoratedLibraryItem,
  right: DecoratedLibraryItem,
  sortKey: LibrarySortKey
): number {
  switch (sortKey) {
    case 'downloadedAt-desc':
      return (
        compareDesc(left.primaryDate, right.primaryDate) ||
        compareDesc(left.createdAt, right.createdAt) ||
        compareText(left.titleText, right.titleText) ||
        compareText(left.fileNameText, right.fileNameText)
      )

    case 'downloadedAt-asc':
      return (
        compareAsc(left.primaryDate, right.primaryDate) ||
        compareAsc(left.createdAt, right.createdAt) ||
        compareText(left.titleText, right.titleText) ||
        compareText(left.fileNameText, right.fileNameText)
      )

    case 'title-asc':
      return (
        compareText(left.titleText, right.titleText) ||
        compareDesc(left.createdAt, right.createdAt) ||
        compareText(left.fileNameText, right.fileNameText)
      )

    case 'fileSize-desc':
      return (
        compareDesc(left.fileSize, right.fileSize) ||
        compareDesc(left.createdAt, right.createdAt) ||
        compareText(left.titleText, right.titleText) ||
        compareText(left.fileNameText, right.fileNameText)
      )

    default:
      return 0
  }
}

function decorate(item: LibraryItem, index: number): DecoratedLibraryItem {
  const createdAt = toSafeNumber(item.createdAt)
  const downloadedAt = toSafeDownloadedAt(item)
  const trimmedTitle = item.title?.trim() || ''
  const trimmedFileName = item.fileName?.trim() || ''
  return {
    item,
    index,
    primaryDate: downloadedAt || createdAt,
    createdAt,
    fileSize: toSafeNumber(item.fileSize),
    titleText: trimmedTitle || trimmedFileName,
    fileNameText: trimmedFileName
  }
}

export function sortLibraryItems(
  items: readonly LibraryItem[],
  sortKey: LibrarySortKey
): LibraryItem[] {
  return items
    .map((item, index) => decorate(item, index))
    .sort(
      (left, right) => compareDecoratedBySortKey(left, right, sortKey) || left.index - right.index
    )
    .map(({ item }) => item)
}
