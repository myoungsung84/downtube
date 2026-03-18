import type { MediaInfo, MediaKind } from '../types/player.types'

export const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'opus'])

export function toMediaUrl(filePath?: string): string | undefined {
  if (!filePath) return undefined
  const url = new URL('downtube-media://media')
  url.searchParams.set('path', filePath)
  return url.toString()
}

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
