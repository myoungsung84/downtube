import MainPage from '@renderer/pages/main-page'
import PlayerPage from '@renderer/pages/player-page'
import { createHashRouter } from 'react-router-dom'

export const router = createHashRouter(
  [
    {
      path: '/',
      element: <MainPage />
    },
    {
      path: '/player',
      element: <PlayerPage />
    }
  ],
  {
    future: {}
  }
)
