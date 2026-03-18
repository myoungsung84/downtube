import './styles/fonts.css'
import './styles/global.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { initializeI18n } from './shared/i18n/i18n'
import ThemedApp from './themed-app'

async function bootstrap(): Promise<void> {
  const resolvedLanguage = await window.api.resolveAppLanguage().catch((err: unknown) => {
    console.warn('Failed to resolve app language:', err)
    return 'ko' as const
  })
  try {
    await initializeI18n(resolvedLanguage)
  } catch (err) {
    console.error('i18n initialization failed, retrying with default language:', err)
    await initializeI18n('ko')
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemedApp />
    </StrictMode>
  )
}

void bootstrap()
