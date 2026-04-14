import type { LibrarySortKey } from './library.types'

export type RecentUrlHistoryItem = {
  url: string
  title: string
  kind: 'single' | 'playlist'
}

export type AppLanguage = 'ko' | 'en'
export type AppLanguagePreference = 'system' | AppLanguage

export const APP_THEME_PRESETS = [
  'default',
  'slate',
  'rose',
  'ink',
  'jade',
  'aurora',
  'ember'
] as const
export type AppThemePreset = (typeof APP_THEME_PRESETS)[number]

export function isAppThemePreset(value: unknown): value is AppThemePreset {
  return typeof value === 'string' && APP_THEME_PRESETS.includes(value as AppThemePreset)
}

export const settingKeys = [
  'app.language',
  'app.themeMode',
  'app.themePreset',
  'player.volume',
  'player.muted',
  'player.visualizerEnabled',
  'player.ambientParticlesEnabled',
  'downloads.defaultType',
  'downloads.playlistLimit',
  'downloads.recentUrls',
  'library.sortKey'
] as const

export type SettingKey = (typeof settingKeys)[number]

export type SettingValueMap = {
  'app.language': AppLanguagePreference
  'app.themeMode': 'light' | 'dark' | 'system'
  'app.themePreset': AppThemePreset
  'player.volume': number
  'player.muted': boolean
  'player.visualizerEnabled': boolean
  'player.ambientParticlesEnabled': boolean
  'downloads.defaultType': 'video' | 'audio'
  'downloads.playlistLimit': number
  'downloads.recentUrls': RecentUrlHistoryItem[]
  'library.sortKey': LibrarySortKey
}
