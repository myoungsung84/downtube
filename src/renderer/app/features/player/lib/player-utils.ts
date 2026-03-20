import { toMediaUrl } from '@renderer/shared/lib/media-url'
import clamp from 'lodash/clamp'

import type { PlayerQueueItem, PlayerRepeatMode } from '../types/player.types'
import type { MediaInfo, MediaKind, MediaOrientation } from '../types/player.types'

export { toMediaUrl }

export const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'opus'])

export function isFiniteDuration(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}

export function sanitizePlaybackTime(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0
}

export function clampSeekTime(value: number, duration: number): number {
  const safeValue = sanitizePlaybackTime(value)
  if (!isFiniteDuration(duration)) return safeValue
  return clamp(safeValue, 0, duration)
}

export function resolveInitialMediaKind(extension: string): MediaKind {
  if (AUDIO_EXTENSIONS.has(extension)) return 'audio'
  if (extension === 'webm') return 'unknown'
  return 'video'
}

export function buildInitialMediaInfo(fileName: string): MediaInfo {
  return { fileName, duration: 0, width: 0, height: 0 }
}

export function resolveMediaOrientation(width: number, height: number): MediaOrientation {
  if (width <= 0 || height <= 0) return 'unknown'
  if (width > height) return 'landscape'
  if (height > width) return 'portrait'
  return 'square'
}

export function buildPlayerQueue(paths: string[]): PlayerQueueItem[] {
  return paths
    .map((mediaPath) => mediaPath.trim())
    .filter((mediaPath) => mediaPath.length > 0)
    .map((mediaPath) => {
      const segments = mediaPath.split(/[\\/]/).filter(Boolean)
      const fileName = segments[segments.length - 1] ?? ''

      return {
        mediaPath,
        mediaSrc: toMediaUrl(mediaPath) ?? '',
        fileName
      }
    })
}

export function resolveNextQueueIndex(
  queueLength: number,
  currentIndex: number,
  repeatMode: PlayerRepeatMode
): number | null {
  if (queueLength === 0) return null
  if (currentIndex < queueLength - 1) return currentIndex + 1
  return repeatMode === 'all' ? 0 : null
}

export function resolvePreviousQueueIndex(
  queueLength: number,
  currentIndex: number,
  repeatMode: PlayerRepeatMode
): number | null {
  if (queueLength === 0) return null
  if (currentIndex > 0) return currentIndex - 1
  return repeatMode === 'all' ? queueLength - 1 : null
}

export function cycleRepeatMode(repeatMode: PlayerRepeatMode): PlayerRepeatMode {
  if (repeatMode === 'off') return 'all'
  if (repeatMode === 'all') return 'one'
  return 'off'
}

export function removeQueueItemAtIndex(
  queue: PlayerQueueItem[],
  currentIndex: number,
  removeIndex: number
): { queue: PlayerQueueItem[]; currentIndex: number } {
  const nextQueue = queue.filter((_, index) => index !== removeIndex)
  if (nextQueue.length === 0) {
    return { queue: nextQueue, currentIndex: 0 }
  }

  if (removeIndex < currentIndex) {
    return {
      queue: nextQueue,
      currentIndex: clamp(currentIndex - 1, 0, nextQueue.length - 1)
    }
  }

  if (removeIndex === currentIndex) {
    return {
      queue: nextQueue,
      currentIndex: clamp(currentIndex, 0, nextQueue.length - 1)
    }
  }

  return { queue: nextQueue, currentIndex }
}
