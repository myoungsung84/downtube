import './styles/fonts.css'
import './styles/global.css'
import './shared/i18n/i18n'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import ThemedApp from './themed-app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemedApp />
  </StrictMode>
)
