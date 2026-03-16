export const settingKeys = [
  'app.themeMode',
  'player.volume',
  'player.muted',
  'player.visualizerEnabled',
  'downloads.defaultType',
  'downloads.playlistLimit',
  'downloads.recentUrls'
] as const

export type SettingKey = (typeof settingKeys)[number]

export type SettingValueMap = {
  'app.themeMode': 'light' | 'dark' | 'system'
  'player.volume': number
  'player.muted': boolean
  'player.visualizerEnabled': boolean
  'downloads.defaultType': 'video' | 'audio'
  'downloads.playlistLimit': number
  'downloads.recentUrls': string[]
}
