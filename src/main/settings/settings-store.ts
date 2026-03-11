import Store from 'electron-store'

import type { SettingKey, SettingValueMap } from '../../types/settings.types'
import { settingsDefaults } from './settings-defaults'
import { validateSettingValue } from './settings-validator'

const settingsStore = new Store<SettingValueMap>({
  name: 'settings',
  defaults: settingsDefaults
})

export function getSetting<K extends SettingKey>(key: K): SettingValueMap[K] {
  const rawValue = settingsStore.get(key) as unknown

  if (rawValue === undefined) {
    return settingsDefaults[key]
  }

  validateSettingValue(key, rawValue)
  return rawValue
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
