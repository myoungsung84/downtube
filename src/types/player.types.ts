export type PlayerOpenPayload = {
  paths: string[]
}

export type PlayerRepeatMode = 'off' | 'one' | 'all'

export type PlayerQueueItem = {
  mediaPath: string
  mediaSrc: string
  fileName: string
  title?: string
  artist?: string
  thumbnailPath?: string
  sidecarJsonPath?: string
}
