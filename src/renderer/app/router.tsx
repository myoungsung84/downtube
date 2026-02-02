import MainScreen from '@renderer/pages/MainScreen'
import Player from '@renderer/pages/Player'
import { createHashRouter } from 'react-router-dom'

export const router = createHashRouter(
  [
    {
      path: '/',
      element: <MainScreen />
    },
    {
      path: '/player',
      element: <Player />
    }
  ],
  {
    future: {}
  }
)
