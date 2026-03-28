import axios from 'axios'

import {
  UPDATE_REPOSITORY,
  WINDOWS_PORTABLE_APP_NAME,
  type GithubLatestRelease
} from '../../shared/update.types'

type GithubReleaseAssetResponse = {
  name?: string
  browser_download_url?: string
}

type GithubLatestReleaseResponse = {
  tag_name?: string
  html_url?: string
  published_at?: string | null
  assets?: GithubReleaseAssetResponse[]
}

const GITHUB_LATEST_RELEASE_URL = `https://api.github.com/repos/${UPDATE_REPOSITORY.owner}/${UPDATE_REPOSITORY.name}/releases/latest`

function normalizeReleaseVersion(tagName: string): string {
  return tagName.trim().replace(/^v/i, '').replace(/-win$/i, '')
}

function getExpectedWindowsPortableAssetName(tagName: string): string {
  return `${WINDOWS_PORTABLE_APP_NAME}-${tagName}-unpacked.zip`
}

function findWindowsPortableAsset(
  assets: GithubReleaseAssetResponse[],
  expectedAssetName: string
): GithubReleaseAssetResponse | undefined {
  return assets.find(
    (asset) =>
      typeof asset.name === 'string' &&
      asset.name.trim().toLowerCase() === expectedAssetName.toLowerCase()
  )
}

export async function fetchLatestGithubRelease(): Promise<GithubLatestRelease> {
  const response = await axios.get<GithubLatestReleaseResponse>(GITHUB_LATEST_RELEASE_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Downtube'
    }
  })

  const tagName = typeof response.data.tag_name === 'string' ? response.data.tag_name.trim() : ''
  const htmlUrl = typeof response.data.html_url === 'string' ? response.data.html_url.trim() : ''

  if (!tagName || !htmlUrl) {
    throw new Error('Invalid GitHub latest release response')
  }

  const expectedAssetName = getExpectedWindowsPortableAssetName(tagName)
  const asset = findWindowsPortableAsset(response.data.assets ?? [], expectedAssetName)

  return {
    tagName,
    latestVersion: normalizeReleaseVersion(tagName),
    htmlUrl,
    publishedAt:
      typeof response.data.published_at === 'string' ? response.data.published_at : null,
    assetName: typeof asset?.name === 'string' ? asset.name : null,
    assetDownloadUrl:
      typeof asset?.browser_download_url === 'string' ? asset.browser_download_url : null,
    expectedAssetName
  }
}
