export type RecentUrlHistoryItem = {
  url: string
  title: string
  kind: 'single' | 'playlist'
}

export type AppLanguage = 'ko' | 'en'
export type AppLanguagePreference = 'system' | AppLanguage

export const settingKeys = [
  'app.language',
  'app.themeMode',
  'player.volume',
  'player.muted',
  'player.visualizerEnabled',
  'player.ambientParticlesEnabled',
  'downloads.defaultType',
  'downloads.playlistLimit',
  'downloads.recentUrls'
] as const

export type SettingKey = (typeof settingKeys)[number]

export type SettingValueMap = {
  'app.language': AppLanguagePreference
  'app.themeMode': 'light' | 'dark' | 'system'
  'player.volume': number
  'player.muted': boolean
  'player.visualizerEnabled': boolean
  'player.ambientParticlesEnabled': boolean
  'downloads.defaultType': 'video' | 'audio'
  'downloads.playlistLimit': number
  'downloads.recentUrls': RecentUrlHistoryItem[]
}
