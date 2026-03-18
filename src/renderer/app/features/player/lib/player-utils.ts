import type { MediaInfo, MediaKind } from '../types/player.types'
import { toMediaUrl } from '@renderer/shared/lib/media-url'

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
  return Math.max(0, Math.min(duration, safeValue))
}

export function resolveInitialMediaKind(extension: string): MediaKind {
  if (AUDIO_EXTENSIONS.has(extension)) return 'audio'
  if (extension === 'webm') return 'unknown'
  return 'video'
}

export function buildInitialMediaInfo(fileName: string): MediaInfo {
  return { fileName, duration: 0, width: 0, height: 0 }
}
