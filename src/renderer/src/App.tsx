import MainScreen from '@renderer/page/MainScreen'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Player from './page/Player'

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/player" element={<Player />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
