import glob from 'fast-glob'
import fs from 'fs'
import path from 'path'

export async function findRealDownloadedFile(dir: string, pattern: string): Promise<string> {
  const files = await glob(pattern, { cwd: dir, absolute: true })
  if (files.length === 0) throw new Error(`No file found for pattern: ${pattern}`)
  return files[0]
}

export async function resolveByPrefixInDir(args: {
  dir: string
  prefix: string
  fallbackPattern: string
}): Promise<string> {
  const { dir, prefix, fallbackPattern } = args
  const files = await fs.promises.readdir(dir)
  const hit = files.find((f) => f.startsWith(prefix + '.'))
  if (hit) return path.join(dir, hit)
  return findRealDownloadedFile(dir, fallbackPattern)
}
