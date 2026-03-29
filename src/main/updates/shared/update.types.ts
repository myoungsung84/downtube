export const UPDATE_REPOSITORY = {
  owner: 'myoungsung84',
  name: 'downtube'
} as const

export const WINDOWS_PORTABLE_APP_NAME = 'downtube'
export const WINDOWS_PORTABLE_PRODUCT_NAME = 'Downtube'
export const WINDOWS_PORTABLE_EXECUTABLE_NAME = `${WINDOWS_PORTABLE_PRODUCT_NAME}.exe`
export const UPDATE_CACHE_DIR_NAME = 'update-cache'
export const UPDATE_HELPER_EXE_NAME = 'update-helper.exe'
export const UPDATE_APPLY_PLAN_PREFIX = 'apply-plan-'
export const UPDATE_APPLY_LOG_PREFIX = 'apply-update-'

export type GithubLatestRelease = {
  tagName: string
  latestVersion: string
  htmlUrl: string
  publishedAt: string | null
  assetName: string | null
  assetDownloadUrl: string | null
  expectedAssetName: string
}

export type UpdateCachePaths = {
  cacheRootDir: string
  versionDir: string
  attemptDir: string
  zipPath: string
  extractedDir: string
}
