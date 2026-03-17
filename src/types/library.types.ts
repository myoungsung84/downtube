export type LibraryItemType = 'video' | 'audio'

export type LibraryItem = {
  id: string
  type: LibraryItemType
  fileName: string
  filePath: string
  fileSize: number
  createdAt: number
  downloadedAt?: string
  title?: string
  uploader?: string
  thumbnailPath?: string
  jsonPath?: string
  extension: string
}
