import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'

import type { LibraryItem, LibraryItemType } from '../../types/library.types'

const VIDEO_EXTENSIONS = new Set(['.mkv', '.mp4', '.webm', '.mov', '.m4v'])
const AUDIO_EXTENSIONS = new Set(['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.opus', '.flac'])
const THUMBNAIL_EXTENSIONS = ['.jpg', '.png', '.webp'] as const

type SidecarInfo = {
  downloadedAt?: string
  title?: string
  uploader?: string
  type?: LibraryItemType
}

type FileEntry = {
  absolutePath: string
  dirent: fs.Dirent
}

async function collectFiles(rootDir: string): Promise<FileEntry[]> {
  const entries = await fs.promises.readdir(rootDir, { withFileTypes: true })
  const files: FileEntry[] = []

  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)))
      continue
    }

    if (entry.isFile()) {
      files.push({ absolutePath, dirent: entry })
    }
  }

  return files
}

function inferItemType(extension: string): LibraryItemType | null {
  if (AUDIO_EXTENSIONS.has(extension)) return 'audio'
  if (VIDEO_EXTENSIONS.has(extension)) return 'video'
  return null
}

function isIntermediateFile(filePath: string): boolean {
  const baseName = path.basename(filePath, path.extname(filePath)).toLowerCase()
  return baseName.endsWith('_video') || baseName.endsWith('_audio')
}

function readSidecarInfo(jsonPath?: string): SidecarInfo | undefined {
  if (!jsonPath) return undefined

  try {
    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const parsed = JSON.parse(raw) as {
      downloadedAt?: unknown
      type?: unknown
      info?: {
        title?: unknown
        uploader?: unknown
        channel?: unknown
      } | null
    }

    return {
      downloadedAt: typeof parsed.downloadedAt === 'string' ? parsed.downloadedAt : undefined,
      title: typeof parsed.info?.title === 'string' ? parsed.info.title : undefined,
      uploader:
        typeof parsed.info?.uploader === 'string'
          ? parsed.info.uploader
          : typeof parsed.info?.channel === 'string'
            ? parsed.info.channel
            : undefined,
      type: parsed.type === 'video' || parsed.type === 'audio' ? parsed.type : undefined
    }
  } catch {
    return undefined
  }
}

function getSortTime(item: LibraryItem): number {
  const downloadedAt = item.downloadedAt ? Date.parse(item.downloadedAt) : NaN
  return Number.isFinite(downloadedAt) ? downloadedAt : item.createdAt
}

export async function listLibraryItems(rootDir: string): Promise<LibraryItem[]> {
  await fs.promises.mkdir(rootDir, { recursive: true })

  const files = await collectFiles(rootDir)
  const fileMap = new Map(files.map((entry) => [entry.absolutePath, entry.dirent] as const))
  const items: LibraryItem[] = []

  for (const file of files) {
    const extension = path.extname(file.absolutePath).toLowerCase()
    const fallbackType = inferItemType(extension)

    if (!fallbackType) continue
    if (isIntermediateFile(file.absolutePath)) continue

    const sidecarBasePath = file.absolutePath.slice(0, -extension.length)
    const jsonPath = fileMap.has(`${sidecarBasePath}.json`) ? `${sidecarBasePath}.json` : undefined
    const thumbnailPath = THUMBNAIL_EXTENSIONS.map((ext) => `${sidecarBasePath}${ext}`).find(
      (candidate) => fileMap.has(candidate)
    )

    const sidecarInfo = readSidecarInfo(jsonPath)
    const stat = await fs.promises.stat(file.absolutePath)
    const fileName = path.basename(file.absolutePath)

    items.push({
      id: createHash('sha1').update(file.absolutePath).digest('hex'),
      type: sidecarInfo?.type ?? fallbackType,
      fileName,
      filePath: file.absolutePath,
      fileSize: stat.size,
      createdAt: stat.birthtimeMs || stat.ctimeMs || stat.mtimeMs,
      downloadedAt: sidecarInfo?.downloadedAt,
      title: sidecarInfo?.title?.trim() || path.basename(fileName, extension),
      uploader: sidecarInfo?.uploader?.trim() || undefined,
      thumbnailPath,
      jsonPath,
      extension: extension.replace('.', '').toLowerCase()
    })
  }

  return items.sort((a, b) => getSortTime(b) - getSortTime(a))
}

function isPathInsideRoot(rootDir: string, targetPath: string): boolean {
  const resolvedRoot = path.resolve(rootDir)
  const resolvedTarget = path.resolve(targetPath)
  const normalizedRoot = process.platform === 'win32' ? resolvedRoot.toLowerCase() : resolvedRoot
  const normalizedTarget =
    process.platform === 'win32' ? resolvedTarget.toLowerCase() : resolvedTarget

  return normalizedTarget.startsWith(`${normalizedRoot}${path.sep}`)
}

export async function deleteLibraryItem(rootDir: string, filePath: string): Promise<void> {
  if (!filePath || !isPathInsideRoot(rootDir, filePath)) {
    throw new Error('잘못된 파일 경로입니다.')
  }

  const extension = path.extname(filePath)
  const sidecarBasePath = extension ? filePath.slice(0, -extension.length) : filePath
  const relatedPaths = [
    filePath,
    `${sidecarBasePath}.json`,
    ...THUMBNAIL_EXTENSIONS.map((thumbnailExtension) => `${sidecarBasePath}${thumbnailExtension}`)
  ]

  await Promise.all(
    relatedPaths.map(async (candidate) => {
      try {
        await fs.promises.unlink(candidate)
      } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error
      }
    })
  )
}
