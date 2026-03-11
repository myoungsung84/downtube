export const settingKeys = ['player.volume', 'player.muted', 'player.visualizerEnabled'] as const

export type SettingKey = (typeof settingKeys)[number]

export type SettingValueMap = {
  'player.volume': number
  'player.muted': boolean
  'player.visualizerEnabled': boolean
}
