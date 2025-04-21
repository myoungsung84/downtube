import { Stack } from '@mui/material'
import DownloadList from '@renderer/components/DownloadList'
import NavigationBar from '@renderer/components/NavigationBar'

function MainScreen(): React.JSX.Element {
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

  const items = [
    {
      id: 1,
      title: 'Video 1',
      url: 'https://www.youtube.com/watch?v=example1',
      status: 'downloading'
    },
    {
      id: 2,
      title: 'Video 2',
      url: 'https://www.youtube.com/watch?v=example2',
      status: 'completed'
    }
  ]

  return (
    <Stack>
      <NavigationBar onSubmit={handleDownload} />
      <Stack>
        <DownloadList items={items} />
      </Stack>
    </Stack>
  )
}

export default MainScreen
