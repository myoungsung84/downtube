import MainScreen from '@renderer/page/MainScreen'
import { HashRouter, Route, Routes } from 'react-router-dom'

import Player from './page/Player'

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/player" element={<Player />} />
      </Routes>
    </HashRouter>
  )
}

export default App
