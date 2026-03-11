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

    default:
      return assertNever(key)
  }
}
