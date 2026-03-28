import { app } from 'electron'
import fs from 'fs'
import path from 'path'

import { UPDATE_CACHE_DIR_NAME, type UpdateCachePaths } from '../../shared/update.types'

export function getUpdateCachePaths(latestVersion: string, assetName: string): UpdateCachePaths {
  const cacheRootDir = path.join(app.getPath('userData'), UPDATE_CACHE_DIR_NAME)
  const versionDir = path.join(cacheRootDir, latestVersion)

  return {
    cacheRootDir,
    versionDir,
    zipPath: path.join(versionDir, assetName),
    extractedDir: path.join(versionDir, 'extracted')
  }
}

export async function prepareUpdateCachePaths(
  latestVersion: string,
  assetName: string
): Promise<UpdateCachePaths> {
  const paths = getUpdateCachePaths(latestVersion, assetName)

  await fs.promises.rm(paths.versionDir, { recursive: true, force: true })
  await fs.promises.mkdir(paths.versionDir, { recursive: true })

  return paths
}
