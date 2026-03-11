import type { SettingKey, SettingValueMap } from '@src/types/settings.types'
import { create } from 'zustand'

type HydratedKeysMap = Partial<Record<SettingKey, boolean>>

interface SettingsStoreState {
  values: Partial<SettingValueMap>
  hydratedKeys: HydratedKeysMap
  getValue: <K extends SettingKey>(key: K) => SettingValueMap[K] | undefined
  isHydrated: (key: SettingKey) => boolean
  hydrateSetting: <K extends SettingKey>(key: K) => Promise<SettingValueMap[K]>
  hydrateSettings: <const K extends readonly SettingKey[]>(keys: K) => Promise<void>
  setValue: <K extends SettingKey>(key: K, value: SettingValueMap[K]) => Promise<SettingValueMap[K]>
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  values: {},
  hydratedKeys: {},

  getValue: (key) => get().values[key],

  isHydrated: (key) => Boolean(get().hydratedKeys[key]),

  hydrateSetting: async (key) => {
    const value = await window.api.getSetting(key)

    set((state) => ({
      values: {
        ...state.values,
        [key]: value
      },
      hydratedKeys: {
        ...state.hydratedKeys,
        [key]: true
      }
    }))

    return value
  },

  hydrateSettings: async (keys) => {
    if (keys.length === 0) return

    const nextValues = await window.api.getSettings(keys)

    set((state) => {
      const nextHydratedKeys = { ...state.hydratedKeys }
      for (const key of keys) {
        nextHydratedKeys[key] = true
      }

      return {
        values: {
          ...state.values,
          ...nextValues
        },
        hydratedKeys: nextHydratedKeys
      }
    })
  },

  setValue: async (key, value) => {
    const savedValue = await window.api.setSetting(key, value)

    set((state) => ({
      values: {
        ...state.values,
        [key]: savedValue
      },
      hydratedKeys: {
        ...state.hydratedKeys,
        [key]: true
      }
    }))

    return savedValue
  }
}))
