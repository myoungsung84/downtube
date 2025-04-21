import { app } from 'electron'
import path from 'path'
import fs from 'fs'

const isWindows = process.platform === 'win32'

/**
 * yt-dlp, ffmpeg 등 실행 파일 경로 반환
 * @param filename 실행 파일명 (확장자 제외)
 * @returns 실행 가능한 절대 경로
 */
export function locateBinary(filename: string): string {
  const binaryName = isWindows ? `${filename}.exe` : filename

  let resolvedPath: string

  if (!app.isPackaged) {
    // ✅ 개발 환경 - 루트 기준 bin/
    resolvedPath = path.resolve(__dirname, '../../bin', binaryName)
    console.log('[dev] binary path:', resolvedPath)
  } else {
    // ✅ 배포 환경 - resources/bin/
    resolvedPath = path.resolve(process.resourcesPath, 'bin', binaryName)
    console.log('[prod] binary path:', resolvedPath)
  }

  if (!fs.existsSync(resolvedPath)) {
    console.warn(`[locateBinary] Binary not found at: ${resolvedPath}`)
  }

  return resolvedPath
}

/**
 * 유튜브 URL에서 ID를 추출하는 함수
 * @param url 유튜브 URL
 * @returns 유튜브 ID 또는 빈 문자열
 */
export function youtubeIdFromUrl(url: string): string | '' {
  const regex = /(?:youtube\.com\/(?:.*v=|.*\/shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = url.match(regex)
  if (match) return match[1]

  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v') ?? ''
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.replace('/', '')
    }
  } catch {
    console.error('Invalid URL:', url)
  }
  return ''
}
