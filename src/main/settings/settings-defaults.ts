import type { SettingValueMap } from '../../types/settings.types'

export const settingsDefaults: SettingValueMap = {
  'app.language': 'system',
  'app.themeMode': 'system',
  'player.volume': 1,
  'player.muted': false,
  'player.visualizerEnabled': false,
  'player.ambientParticlesEnabled': false,
  'downloads.defaultType': 'video',
  'downloads.playlistLimit': 10,
  'downloads.recentUrls': []
}
