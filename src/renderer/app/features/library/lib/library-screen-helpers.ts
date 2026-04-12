import 'dayjs/locale/ko'

import type { LibraryItem } from '@src/types/library.types'
import dayjs from 'dayjs'

import type { LibraryScreenLanguage } from '../types/library-screen.types'

export function formatLibraryFileSize(fileSize: number): string {
  if (!Number.isFinite(fileSize) || fileSize <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = fileSize
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value >= 100 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

export function formatLibraryItemDate(item: LibraryItem, language: LibraryScreenLanguage): string {
  const downloadedAt = item.downloadedAt ? dayjs(item.downloadedAt) : null
  const timestamp = downloadedAt?.isValid() ? downloadedAt : dayjs(item.createdAt)

  return timestamp.locale(language).format('YYYY. MM. DD. A hh:mm')
}

export function getLibraryItemDisplayTitle(item: Pick<LibraryItem, 'title' | 'fileName'>): string {
  return item.title ?? item.fileName
}

export function buildLibraryPlayerQueuePaths(
  items: readonly LibraryItem[],
  selectedFilePath: string
): string[] {
  const orderedPaths = items.map((item) => item.filePath)
  const startIndex = orderedPaths.findIndex((filePath) => filePath === selectedFilePath)

  return startIndex <= 0
    ? orderedPaths
    : [...orderedPaths.slice(startIndex), ...orderedPaths.slice(0, startIndex)]
}
