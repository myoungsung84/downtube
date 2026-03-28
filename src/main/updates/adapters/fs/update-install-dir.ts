import { app } from 'electron'
import path from 'path'

function normalizePathForCompare(targetPath: string): string {
  const resolved = path.resolve(targetPath)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

export function getCurrentInstallDir(): string | null {
  return app.isPackaged ? path.dirname(process.execPath) : null
}

export function isSamePath(leftPath: string, rightPath: string): boolean {
  return normalizePathForCompare(leftPath) === normalizePathForCompare(rightPath)
}

function isPathInside(rootPath: string, childPath: string): boolean {
  const normalizedRoot = normalizePathForCompare(rootPath)
  const normalizedChild = normalizePathForCompare(childPath)
  const relative = path.relative(normalizedRoot, normalizedChild)

  return relative.length > 0 && !relative.startsWith('..') && !path.isAbsolute(relative)
}

export function pathsOverlap(leftPath: string, rightPath: string): boolean {
  return (
    isSamePath(leftPath, rightPath) ||
    isPathInside(leftPath, rightPath) ||
    isPathInside(rightPath, leftPath)
  )
}
