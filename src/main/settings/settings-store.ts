import Store from 'electron-store'

import type { SettingKey, SettingValueMap } from '../../types/settings.types'
import { settingKeys } from '../../types/settings.types'
import { settingsDefaults } from './settings-defaults'
import { validateSettingValue } from './settings-validator'

const StoreConstructor = (Store as unknown as { default?: typeof Store }).default ?? Store

const settingsStore = new StoreConstructor<SettingValueMap>({
  name: 'settings',
  defaults: settingsDefaults
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
