import LibraryPage from '@renderer/pages/library-page'
import MainPage from '@renderer/pages/main-page'
import PlayerPage from '@renderer/pages/player-page'
import SettingsPage from '@renderer/pages/settings-page'
import SplashPage from '@renderer/pages/splash-page'
import { createHashRouter, Navigate } from 'react-router-dom'

export const router = createHashRouter(
  [
    {
      path: '/splash',
      element: <SplashPage />
    },
    {
      path: '/',
      element: <MainPage />
    },
    {
      path: '/library',
      element: <LibraryPage />
    },
    {
      path: '/player',
      element: <PlayerPage />
    },
    {
      path: '/settings',
      element: <SettingsPage />
    },
    {
      path: '*',
      element: <Navigate to="/splash" replace />
    }
  ],
  {
    future: {}
  }
)
