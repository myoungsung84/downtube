import Store from 'electron-store'

import type {
  AppLanguage,
  AppLanguagePreference,
  SettingKey,
  SettingValueMap
} from '../../types/settings.types'
import { settingKeys } from '../../types/settings.types'
import { settingsDefaults } from './settings-defaults'
import { resolveAppLanguagePreference } from './settings-language'
import { validateSettingValue } from './settings-validator'

const StoreConstructor = (Store as unknown as { default?: typeof Store }).default ?? Store
const settingsStoreDefaults: Partial<SettingValueMap> = {
  'app.themeMode': settingsDefaults['app.themeMode'],
  'player.volume': settingsDefaults['player.volume'],
  'player.muted': settingsDefaults['player.muted'],
  'player.visualizerEnabled': settingsDefaults['player.visualizerEnabled'],
  'downloads.defaultType': settingsDefaults['downloads.defaultType'],
  'downloads.playlistLimit': settingsDefaults['downloads.playlistLimit'],
  'downloads.recentUrls': settingsDefaults['downloads.recentUrls']
}

const settingsStore = new StoreConstructor<SettingValueMap>({
  name: 'settings',
  defaults: settingsStoreDefaults as Readonly<SettingValueMap>
})

export function getSetting<K extends SettingKey>(key: K): SettingValueMap[K] {
  if (!settingKeys.includes(key)) {
    throw new Error(`Invalid setting key: ${String(key)}`)
  }

  const rawValue = settingsStore.get(key) as unknown

  if (rawValue === undefined) {
    return settingsDefaults[key]
  }

  try {
    validateSettingValue(key, rawValue)
    return rawValue
  } catch {
    const defaultValue = settingsDefaults[key]
    settingsStore.set(key, defaultValue)
    return defaultValue
  }
}

export function ensureSettingsLanguage(): AppLanguage {
  return resolveAppLanguagePreference(getSetting('app.language'))
}

export function resolveSettingsLanguage(
  preference: AppLanguagePreference = getSetting('app.language')
): AppLanguage {
  return resolveAppLanguagePreference(preference)
}

export function getSettings<const K extends readonly SettingKey[]>(
  keys: K
): Pick<SettingValueMap, K[number]> {
  const entries = keys.map((key) => [key, getSetting(key)] as const)
  return Object.fromEntries(entries) as Pick<SettingValueMap, K[number]>
}

export function setSetting<K extends SettingKey>(key: K, value: unknown): SettingValueMap[K] {
  validateSettingValue(key, value)
  settingsStore.set(key, value)
  return getSetting(key)
}
