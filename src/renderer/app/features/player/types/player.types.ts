import type { PlayerQueueItem, PlayerRepeatMode } from '@src/types/player.types'

export type { PlayerQueueItem, PlayerRepeatMode }

export type MediaKind = 'audio' | 'video' | 'unknown'

export type MediaInfo = {
  fileName: string
  duration: number
  width: number
  height: number
}
