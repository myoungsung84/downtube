import './styles/fonts.css'
import './styles/global.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { initializeI18n } from './shared/i18n/i18n'
import ThemedApp from './themed-app'

async function bootstrap(): Promise<void> {
  const resolvedLanguage = await window.api.resolveAppLanguage()
  await initializeI18n(resolvedLanguage)

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemedApp />
    </StrictMode>
  )
}

void bootstrap()
