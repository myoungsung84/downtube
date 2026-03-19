export type RecentUrlHistoryItem = {
  url: string
  title: string
  kind: 'single' | 'playlist'
}

export type AppLanguage = 'ko' | 'en'
export type AppLanguagePreference = 'system' | AppLanguage

export type AppThemePreset = 'default' | 'slate' | 'ink' | 'jade' | 'aurora'

export const settingKeys = [
  'app.language',
  'app.themeMode',
  'app.themePreset',
  'player.volume',
  'player.muted',
  'player.visualizerEnabled',
  'downloads.defaultType',
  'downloads.playlistLimit',
  'downloads.recentUrls'
] as const

export type SettingKey = (typeof settingKeys)[number]

export type SettingValueMap = {
  'app.language': AppLanguagePreference
  'app.themeMode': 'light' | 'dark' | 'system'
  'app.themePreset': AppThemePreset
  'player.volume': number
  'player.muted': boolean
  'player.visualizerEnabled': boolean
  'downloads.defaultType': 'video' | 'audio'
  'downloads.playlistLimit': number
  'downloads.recentUrls': RecentUrlHistoryItem[]
}
