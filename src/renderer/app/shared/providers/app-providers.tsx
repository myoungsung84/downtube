import { useSettingsStore } from '@renderer/features/settings/store/use-settings-store'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import React from 'react'

import DialogProvider from './dialog/dialog-provider'
import ToastProvider from './toast/toast-provider'

const APP_LANGUAGE_KEY = 'app.language' as const

function AppLanguageSync(): React.JSX.Element | null {
  const hydrateSetting = useSettingsStore((state) => state.hydrateSetting)
  const storedLanguage = useSettingsStore((state) => state.values[APP_LANGUAGE_KEY])
  const { changeLanguage } = useI18n()

  React.useEffect(() => {
    void hydrateSetting(APP_LANGUAGE_KEY)
  }, [hydrateSetting])

  React.useEffect(() => {
    if (!storedLanguage) return
    void window.api
      .resolveAppLanguage(storedLanguage)
      .then((resolvedLanguage) => changeLanguage(resolvedLanguage))
  }, [changeLanguage, storedLanguage])

  return null
}

export default function AppProviders(props: { children: React.ReactNode }): React.JSX.Element {
  return (
    <ToastProvider>
      <DialogProvider>
        <AppLanguageSync />
        {props.children}
      </DialogProvider>
    </ToastProvider>
  )
}
