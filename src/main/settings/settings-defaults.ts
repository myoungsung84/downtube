import type { SettingValueMap } from '../../types/settings.types'

export const settingsDefaults: SettingValueMap = {
  'app.language': 'system',
  'app.themeMode': 'system',
  'app.themePreset': 'default',
  'player.volume': 1,
  'player.muted': false,
  'player.visualizerEnabled': false,
  'downloads.defaultType': 'video',
  'downloads.playlistLimit': 10,
  'downloads.recentUrls': []
}
