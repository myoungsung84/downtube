import { app } from 'electron'

import type { AppLanguage, AppLanguagePreference } from '../../types/settings.types'

export function normalizeLanguage(language: string | null | undefined): AppLanguage | undefined {
  const normalized = language?.trim().toLowerCase()
  if (!normalized) return undefined

  if (normalized === 'ko' || normalized.startsWith('ko-')) return 'ko'
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en'

  return undefined
}

export function resolveSystemLanguage(): AppLanguage {
  const preferredLanguages = app.getPreferredSystemLanguages()

  for (const language of preferredLanguages) {
    const normalized = normalizeLanguage(language)
    if (normalized) return normalized
  }

  return 'ko'
}

export function resolveAppLanguagePreference(preference: AppLanguagePreference): AppLanguage {
  return preference === 'system' ? resolveSystemLanguage() : preference
}
