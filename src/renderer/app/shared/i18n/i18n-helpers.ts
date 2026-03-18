import type { AppLanguage } from '@src/types/settings.types'

import { i18n } from './i18n'

export const appLanguages = ['ko', 'en'] as const
export const appNamespaces = [
  'common',
  'navigation',
  'downloads',
  'library',
  'player',
  'settings',
  'splash'
] as const

export type AppNamespace = (typeof appNamespaces)[number]

export function isSupportedLanguage(language: string | null | undefined): language is AppLanguage {
  return language === 'ko' || language === 'en'
}

export function normalizeAppLanguage(language: string | null | undefined): AppLanguage {
  return isSupportedLanguage(language) ? language : 'ko'
}

export function resolveNamespaces(
  namespaces?: AppNamespace | readonly AppNamespace[]
): AppNamespace[] {
  const requested = namespaces ? (Array.isArray(namespaces) ? [...namespaces] : [namespaces]) : []

  return ['common', ...requested.filter((namespace) => namespace !== 'common')].filter(
    (namespace, index, array) => array.indexOf(namespace) === index
  ) as AppNamespace[]
}

export function getCurrentAppLanguage(): AppLanguage {
  return normalizeAppLanguage(i18n.resolvedLanguage ?? i18n.language)
}

export async function changeAppLanguage(language: AppLanguage): Promise<AppLanguage> {
  const normalized = normalizeAppLanguage(language)
  if (i18n.resolvedLanguage !== normalized) {
    await i18n.changeLanguage(normalized)
  }
  return normalized
}
