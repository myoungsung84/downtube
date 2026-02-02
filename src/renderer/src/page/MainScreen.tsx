import { Stack } from '@mui/material'
import { DownloadItemProps } from '@renderer/components/DownloadItem'
import DownloadList from '@renderer/components/DownloadList'
import NavigationBar from '@renderer/components/NavigationBar'
import { useEffect, useState } from 'react'

export default function MainScreen(): React.JSX.Element {
  const [downloadList, setDownloadList] = useState<DownloadItemProps[]>([])

  useEffect(() => {
    window.api.onDownloadProgress(({ url, current, percent }) => {
      setDownloadList((prev) =>
        prev.map((item) => (item.url !== url ? item : { ...item, current, percent }))
      )
    })

    window.api.onDownloadDone(({ url }) => {
      setDownloadList((prev) =>
        prev.map((item) =>
          item.url === url
            ? { ...item, percent: 100, status: 'completed', current: 'complete', isCompleted: true }
            : item
        )
      )
    })
  }, [])

  const handleDownloadInfo = async (url: string): Promise<void> => {
    try {
      const alreadyExists = downloadList.some((item) => item.url === url)
      if (alreadyExists) {
        console.warn(`[INFO] 이미 등록된 URL입니다: ${url}`)
        return
      }

      const baseItem: DownloadItemProps = {
        url,
        status: 'loading', // ✅ 오타 수정 (loding -> loading)
        info: null,
        current: null,
        percent: 0,
        isCompleted: false,
        onDownload: async (_url) => {
          setDownloadList((prev) =>
            prev.map((item) =>
              item.url === _url ? { ...item, current: 'init', status: 'downloading' } : item
            )
          )
          await window.api.download(_url)
        },
        onStop: async (_url) => {
          setDownloadList((prev) =>
            prev.map((item) => (item.url === _url ? { ...item, status: 'stop' } : item))
          )
          await window.api.stopDownload(_url)
        },
        onPlayer: async (_url) => {
          await window.api.playVideo(_url)
        }
      }

      setDownloadList((prev) => [...prev, baseItem])

      const info = await window.api.downloadInfo(url)

      setDownloadList((prev) => {
        const exists = prev.some((item) => item.url === url)
        if (!exists) throw new Error(`URL not found in list: ${url}`)
        return prev.map((item) => (item.url === url ? { ...item, status: 'normal', info } : item))
      })
    } catch (error) {
      console.error('다운로드 정보 처리 중 오류:', error)
      setDownloadList((prev) => prev.filter((item) => item.url !== url))
    }
  }

  return (
    <Stack sx={{ height: '100vh' }}>
      <NavigationBar
        onSubmit={handleDownloadInfo}
        onDirectory={() => window.api.openDownloadDir()}
      />

      {/* ✅ flex children에서 스크롤/가시성 안정화 핵심: flex:1 + minHeight:0 */}
      <Stack sx={{ flex: 1, minHeight: 0 }}>
        <DownloadList items={downloadList} />
      </Stack>
    </Stack>
  )
}
