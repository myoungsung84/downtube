export interface VideoInfo {
  id: string
  title: string
  uploader?: string
  duration?: number
  thumbnail?: string
  view_count?: number
  upload_date?: string
  formats?: Array<{
    format_id: string
    ext: string
    height?: number
    width?: number
    filesize?: number
    tbr?: number
    url: string
    acodec: string
    vcodec: string
  }>
  best_url?: string
}
