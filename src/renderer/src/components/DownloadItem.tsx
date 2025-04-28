import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { VideoInfo } from '@src/types/video-info.types'
import _ from 'lodash'

import DownloadListProgress from './DownloadListProgress'
import InfoText from './InfoText'
import Thumbnail from './Thumbnail'

export type DownloadItemProps = {
  url: string
  status: 'loding' | 'normal' | 'downloading' | 'stop' | 'completed' | 'failed'
  current: 'video' | 'audio' | 'complete' | 'init' | null
  percent?: number
  isCompleted: boolean
  info?: VideoInfo | null
  onDownload: (url: string) => void
  onStop: (url: string) => void
  onPlayer: (url: string) => void
}

export default function DownloadItem(props: DownloadItemProps): React.JSX.Element {
  if (_.isNil(props.info)) {
    return (
      <Stack
        sx={{ padding: 2, borderBottom: '1px solid #ccc', height: 100 }}
        alignItems="center"
        justifyContent={'center'}
      >
        <CircularProgress size={40} color="info" variant="indeterminate" disableShrink />
      </Stack>
    )
  }

  const statusToText = (status: string): string => {
    switch (status) {
      case 'loding':
        return '로딩 중'
      case 'normal':
        return '동영상 다운로드'
      case 'downloading':
        return '다운로드 중'
      case 'stop':
        return '다운로드 중지'
      case 'completed':
        return '다운로드 완료'
      case 'failed':
      default:
        return '다운로드 실패'
    }
  }

  const info = props.info!
  return (
    <Stack sx={{ padding: 2, borderBottom: '1px solid #ccc' }}>
      <Stack direction="row" alignItems="flex-start">
        <Thumbnail
          url={info.thumbnail}
          w={160}
          h={'100%'}
          onClick={() => props.onPlayer(info.best_url ?? '')}
        />
        <Stack alignItems={'flex-start'} spacing={1} sx={{ ml: 1, flex: 1 }}>
          <Stack alignItems="flex-start" sx={{ width: 280 }}>
            <Typography
              noWrap
              variant="button"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
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
          <Button
            variant="outlined"
            color="info"
            onClick={() => {
              switch (props.status) {
                case 'normal':
                case 'stop':
                  props.onDownload(props.url)
                  break
                case 'downloading':
                  props.onStop(props.url)
                  break
                default:
                  break
              }
            }}
          >
            {statusToText(props.status)}
          </Button>
        </Stack>
      </Stack>
      <Box sx={{ width: '100%', mt: 1 }} justifyContent={'center'} alignItems={'center'}>
        <DownloadListProgress current={props.current} percent={props.percent} />
      </Box>
    </Stack>
  )
}
