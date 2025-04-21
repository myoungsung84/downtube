import { Stack } from '@mui/material'
import NavigationBar from './components/NavigationBar'

function App(): React.JSX.Element {
  const handleDownload = (url: string): void => {
    // 다운로드 로직을 여기에 추가합니다.
    console.log('다운로드 시작:', url)
    if (!url.includes('youtube.com')) {
      console.log('유효한 YouTube URL입니다.')
      return
    }
    downloadVideo(url)
  }

  const downloadVideo = async (url: string): Promise<void> => {
    await window.api.download(url)
  }

  return (
    <Stack>
      <NavigationBar onSubmit={handleDownload} />
    </Stack>
  )
}

export default App
