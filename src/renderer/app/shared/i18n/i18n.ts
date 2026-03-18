import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import commonEn from './locales/en/common.json'
import downloadsEn from './locales/en/downloads.json'
import libraryEn from './locales/en/library.json'
import navigationEn from './locales/en/navigation.json'
import playerEn from './locales/en/player.json'
import settingsEn from './locales/en/settings.json'
import splashEn from './locales/en/splash.json'
import commonKo from './locales/ko/common.json'
import downloadsKo from './locales/ko/downloads.json'
import libraryKo from './locales/ko/library.json'
import navigationKo from './locales/ko/navigation.json'
import playerKo from './locales/ko/player.json'
import settingsKo from './locales/ko/settings.json'
import splashKo from './locales/ko/splash.json'

export const defaultNS = 'common'

export const resources = {
  en: {
    common: commonEn,
    downloads: downloadsEn,
    library: libraryEn,
    navigation: navigationEn,
    player: playerEn,
    settings: settingsEn,
    splash: splashEn
  },
  ko: {
    common: commonKo,
    downloads: downloadsKo,
    library: libraryKo,
    navigation: navigationKo,
    player: playerKo,
    settings: settingsKo,
    splash: splashKo
  }
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: 'ko',
  fallbackLng: 'ko',
  defaultNS,
  ns: Object.keys(resources.ko),
  initImmediate: false,
  interpolation: {
    escapeValue: false
  }
})

export { i18n }
