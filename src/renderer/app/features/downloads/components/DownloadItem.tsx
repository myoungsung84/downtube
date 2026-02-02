import { Box, Button, Stack, Typography } from '@mui/material'
import InfoText from '@renderer/features/downloads/components/DownloadMetaInfo'
import Thumbnail from '@renderer/shared/components/ui/Thumbnail'
import type { VideoInfo } from '@src/types/video-info.types'
import _ from 'lodash'
import * as React from 'react'

import DownloadItemSkeleton from './DownloadItemSkeleton'
import DownloadListProgress from './DownloadListProgress'

export type DownloadItemProps = {
  url: string
  status: 'loding' | 'loading' | 'normal' | 'downloading' | 'stop' | 'completed' | 'failed'
  current: 'video' | 'audio' | 'complete' | 'init' | null
  percent?: number
  isCompleted: boolean
  info?: VideoInfo | null
  onDownload: (url: string) => void
  onStop: (url: string) => void
  onPlayer: (url: string) => void
}

function statusToLabel(status: DownloadItemProps['status']): string {
  switch (status) {
    case 'loding':
    case 'loading':
      return '로딩 중'
    case 'normal':
      return '다운로드'
    case 'downloading':
      return '중지'
    case 'stop':
      return '재개'
    case 'completed':
      return '완료'
    case 'failed':
    default:
      return '실패'
  }
}

export default function DownloadItem(props: DownloadItemProps): React.JSX.Element {
  if (_.isNil(props.info)) {
    return <DownloadItemSkeleton />
  }

  const info = props.info!
  const canDownload = props.status === 'normal' || props.status === 'stop'
  const canStop = props.status === 'downloading'

  const handleAction = (): void => {
    if (canDownload) props.onDownload(props.url)
    else if (canStop) props.onStop(props.url)
  }

  const handlePlayer = (): void => {
    const playUrl = info?.best_url ?? null
    if (!playUrl) return
    props.onPlayer(playUrl)
  }

  return (
    <Stack
      sx={{
        p: 2,
        borderRadius: 1,
        border: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'background.paper'
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ minHeight: '104px' }}>
        <Thumbnail url={info.thumbnail} w={180} h={'100%'} onClick={handlePlayer} />

        <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <Stack sx={{ minWidth: 0 }} spacing={1}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                lineHeight: 1.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {info.title}
            </Typography>

            <InfoText
              uploder={info.uploader}
              duration={info.duration}
              viewCount={info.view_count}
            />
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Button
              variant="outlined"
              color="info"
              size="small"
              disabled={!canDownload && !canStop}
              onClick={handleAction}
              sx={{
                borderColor: 'rgba(255,255,255,0.16)',
                '&:hover': { borderColor: 'rgba(255,255,255,0.28)' }
              }}
            >
              {statusToLabel(props.status)}
            </Button>
          </Stack>
        </Stack>
      </Stack>

      <Box sx={{ mt: 1 }}>
        <DownloadListProgress current={props.current} percent={props.percent} />
      </Box>
    </Stack>
  )
}
