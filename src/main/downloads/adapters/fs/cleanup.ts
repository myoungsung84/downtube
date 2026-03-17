import log from 'electron-log'
import fs from 'fs'
import path from 'path'

export async function cleanupFilesByPrefix(args: {
  dir: string
  filenamePrefix: string
}): Promise<void> {
  const { dir, filenamePrefix } = args
  const files = await fs.promises.readdir(dir)
  for (const file of files) {
    if (!file.startsWith(filenamePrefix)) continue
    try {
      await fs.promises.unlink(path.join(dir, file))
    } catch (e) {
      log.warn(`[dl] cleanup unlink warn file=${file}`, e)
    }
  }
}

export function removeFileIfExists(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

export function removeFilesSync(filePaths: string[]): void {
  for (const filePath of filePaths) {
    fs.unlinkSync(filePath)
  }
}

export function removeFilesIfExistsSync(filePaths: string[]): void {
  for (const filePath of filePaths) {
    fs.rmSync(filePath, { force: true })
  }
}
