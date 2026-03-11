import type { SettingKey, SettingValueMap } from '../../types/settings.types'

function assertNever(key: never): never {
  throw new Error(`Unsupported setting key: ${String(key)}`)
}

export function validateSettingValue<K extends SettingKey>(
  key: K,
  value: unknown
): asserts value is SettingValueMap[K] {
  switch (key) {
    case 'player.volume': {
      if (typeof value !== 'number') {
        throw new Error(`[settings] ${key} must be a number`)
      }
      if (!Number.isFinite(value)) {
        throw new Error(`[settings] ${key} must be a finite number`)
      }
      if (value < 0 || value > 1) {
        throw new Error(`[settings] ${key} must be between 0 and 1`)
      }
      return
    }

    case 'player.muted':
    case 'player.visualizerEnabled': {
      if (typeof value !== 'boolean') {
        throw new Error(`[settings] ${key} must be a boolean`)
      }
      return
    }

    case 'downloads.defaultType': {
      if (value !== 'video' && value !== 'audio') {
        throw new Error(`[settings] ${key} must be "video" or "audio"`)
      }
      return
    }

    case 'downloads.playlistLimit': {
      if (typeof value !== 'number') {
        throw new Error(`[settings] ${key} must be a number`)
      }
      if (!Number.isFinite(value)) {
        throw new Error(`[settings] ${key} must be a finite number`)
      }
      if (!Number.isInteger(value) || value < 1) {
        throw new Error(`[settings] ${key} must be an integer greater than or equal to 1`)
      }
      return
    }

    default:
      return assertNever(key)
  }
}
