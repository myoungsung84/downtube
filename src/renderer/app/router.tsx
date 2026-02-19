import MainPage from '@renderer/pages/main-page'
import PlayerPage from '@renderer/pages/player-page'
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
      path: '/player',
      element: <PlayerPage />
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
