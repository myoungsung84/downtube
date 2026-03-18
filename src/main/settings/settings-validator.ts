import isNil from 'lodash/isNil'

import type { SettingKey, SettingValueMap } from '../../types/settings.types'

function assertNever(key: never): never {
  throw new Error(`Unsupported setting key: ${String(key)}`)
}

export function validateSettingValue<K extends SettingKey>(
  key: K,
  value: unknown
): asserts value is SettingValueMap[K] {
  switch (key) {
    case 'app.language': {
      if (value !== 'system' && value !== 'ko' && value !== 'en') {
        throw new Error(`[settings] ${key} must be "system", "ko", or "en"`)
      }
      return
    }

    case 'app.themeMode': {
      if (value !== 'light' && value !== 'dark' && value !== 'system') {
        throw new Error(`[settings] ${key} must be "light", "dark", or "system"`)
      }
      return
    }

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
      if (!Number.isInteger(value) || value < 1 || value > 500) {
        throw new Error(`[settings] ${key} must be an integer between 1 and 500`)
      }
      return
    }

    case 'downloads.recentUrls': {
      if (!Array.isArray(value)) {
        throw new Error(`[settings] ${key} must be an array`)
      }
      if (
        !value.every(
          (item) =>
            typeof item === 'object' &&
            !isNil(item) &&
            typeof item.url === 'string' &&
            typeof item.title === 'string' &&
            (item.kind === 'single' || item.kind === 'playlist')
        )
      ) {
        throw new Error(
          `[settings] ${key} must contain only objects with { url: string, title: string, kind: "single" | "playlist" }`
        )
      }
      return
    }

    default:
      return assertNever(key)
  }
}
