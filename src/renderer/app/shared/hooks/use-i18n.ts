import type { AppLanguage } from '@src/types/settings.types'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  type AppNamespace,
  changeAppLanguage,
  getCurrentAppLanguage,
  resolveNamespaces
} from '../i18n/i18n-helpers'

type UseI18nResult = {
  t: ReturnType<typeof useTranslation>['t']
  i18n: ReturnType<typeof useTranslation>['i18n']
  language: AppLanguage
  changeLanguage: (language: AppLanguage) => Promise<AppLanguage>
}

export function useI18n(namespaces?: AppNamespace | readonly AppNamespace[]): UseI18nResult {
  const resolvedNamespaces = useMemo(() => resolveNamespaces(namespaces), [namespaces])
  const { t, i18n } = useTranslation(resolvedNamespaces)
  const changeLanguage = useCallback((language: AppLanguage) => changeAppLanguage(language), [])

  return {
    t,
    i18n,
    language: getCurrentAppLanguage(),
    changeLanguage
  }
}
