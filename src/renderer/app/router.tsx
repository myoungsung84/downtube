import MainScreen from '@renderer/page/MainScreen'
import Player from '@renderer/page/Player'
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
