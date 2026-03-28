import { app } from 'electron'
import log from 'electron-log'
import fs from 'fs'
import path from 'path'

import { UPDATE_CACHE_DIR_NAME, type UpdateCachePaths } from '../../shared/update.types'
import { removePathBestEffort } from './update-fs'

function createAttemptId(): string {
  return `${Date.now()}-${process.pid}`
}

async function cleanupStaleVersionArtifacts(
  versionDir: string,
  currentAttemptDir: string,
  assetName: string
): Promise<void> {
  const legacyPaths = [path.join(versionDir, assetName), path.join(versionDir, 'extracted')]

  for (const targetPath of legacyPaths) {
    await removePathBestEffort(targetPath, { recursive: true, force: true })
  }

  let entries: fs.Dirent[] = []

  try {
    entries = await fs.promises.readdir(versionDir, { withFileTypes: true })
  } catch (error) {
    log.warn('[updates] failed to list stale cache entries', { versionDir, error })
    return
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('attempt-')) {
      continue
    }

    const attemptDir = path.join(versionDir, entry.name)
    if (attemptDir === currentAttemptDir) {
      continue
    }

    await removePathBestEffort(attemptDir, { recursive: true, force: true })
  }
}

export function getUpdateCachePaths(latestVersion: string, assetName: string): UpdateCachePaths {
  const cacheRootDir = path.join(app.getPath('userData'), UPDATE_CACHE_DIR_NAME)
  const versionDir = path.join(cacheRootDir, latestVersion)
  const attemptDir = path.join(versionDir, `attempt-${createAttemptId()}`)

  return {
    cacheRootDir,
    versionDir,
    attemptDir,
    zipPath: path.join(attemptDir, assetName),
    extractedDir: path.join(attemptDir, 'extracted')
  }
}

export async function cleanupApplyArtifacts(): Promise<void> {
  const cacheRootDir = path.join(app.getPath('userData'), UPDATE_CACHE_DIR_NAME)

  let versionDirs: fs.Dirent[] = []
  try {
    versionDirs = await fs.promises.readdir(cacheRootDir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of versionDirs) {
    if (!entry.isDirectory()) {
      continue
    }

    const versionDir = path.join(cacheRootDir, entry.name)

    let files: fs.Dirent[] = []
    try {
      files = await fs.promises.readdir(versionDir, { withFileTypes: true })
    } catch {
      continue
    }

    for (const file of files) {
      if (!file.isFile()) {
        continue
      }

      const { name } = file
      if (
        name.startsWith('apply-update-') ||
        name.startsWith('apply-plan-') ||
        name === 'update-helper.exe' ||
        name.endsWith('.entries.tmp')
      ) {
        await removePathBestEffort(path.join(versionDir, name), { force: true })
      }
    }
  }
}

export async function prepareUpdateCachePaths(
  latestVersion: string,
  assetName: string
): Promise<UpdateCachePaths> {
  const paths = getUpdateCachePaths(latestVersion, assetName)

  await fs.promises.mkdir(paths.versionDir, { recursive: true })
  await cleanupStaleVersionArtifacts(paths.versionDir, paths.attemptDir, assetName)
  await fs.promises.mkdir(paths.attemptDir, { recursive: true })

  return paths
}
