export const settingKeys = [
  'player.volume',
  'player.muted',
  'player.visualizerEnabled',
  'downloads.defaultType',
  'downloads.playlistLimit'
] as const

export type SettingKey = (typeof settingKeys)[number]

export type SettingValueMap = {
  'player.volume': number
  'player.muted': boolean
  'player.visualizerEnabled': boolean
  'downloads.defaultType': 'video' | 'audio'
  'downloads.playlistLimit': number
}
