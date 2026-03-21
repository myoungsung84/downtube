export type AppErrorCode =
  | 'common.unknown'
  | 'common.network'
  | 'common.timeout'
  | 'common.invalid_request'
  | 'common.not_found'
  | 'common.file_not_found'
  | 'common.access_denied'
  | 'common.open_failed'
  | 'downloads.invalid_url'
  | 'downloads.already_in_queue'
  | 'downloads.video_unavailable'
  | 'downloads.private_video'
  | 'downloads.age_restricted'
  | 'downloads.download_failed'
  | 'player.open_failed'
  | 'library.delete_failed'
  | 'init.initialization_failed'

export type AppError = {
  code: AppErrorCode
  detail?: string
}

export type AppResult<T extends object = Record<never, never>> =
  | ({ success: true } & T)
  | {
      success: false
      error: AppError
    }
