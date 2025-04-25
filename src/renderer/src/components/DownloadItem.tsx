import { Box, Button, CircularProgress, LinearProgress, Stack, Typography } from '@mui/material'
import { formatCompactNumber, secondToTime } from '@src/libs/utils'
import { VideoInfo } from '@src/types/video-info.types'
import _ from 'lodash'

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
        sx={{ padding: 2, borderBottom: '1px solid #ccc' }}
        direction="row"
        alignItems="flex-start"
        justifyContent={'center'}
      >
        <CircularProgress
          size={40}
          sx={{ color: '#1976d2' }}
          variant="indeterminate"
          disableShrink
        />
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

  const infoText = (cur: string): string => {
    switch (cur) {
      case 'video':
        return '비디오 다운로드 중'
      case 'audio':
        return '오디오 다운로드 중'
      case 'complete':
        return '다운로드 완료'
      case 'init':
        return '초기화 중 입니다. 잠시만 기다려 주세요.'
      default:
        return ''
    }
  }

  const info = props.info!
  return (
    <Stack sx={{ padding: 2, borderBottom: '1px solid #ccc' }}>
      <Stack direction="row" alignItems="flex-start">
        <Thumbnail
          url={info.thumbnail}
          w={151}
          h={85}
          onClick={() => props.onPlayer(info.best_url ?? '')}
        />
        <Stack alignItems="flex-start" sx={{ ml: 2, flex: 1, width: 300 }}>
          <Typography
            noWrap
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}
          >
            {info.title}
          </Typography>
          <Stack direction="row" alignItems="center" sx={{ width: '100%' }} spacing={1}>
            <Typography
              noWrap
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100px'
              }}
            >
              {info.uploader}
            </Typography>
            <Typography>{secondToTime(info.duration)}</Typography>
            <Typography>{formatCompactNumber(info.view_count)}</Typography>
          </Stack>
          <Button
            variant="outlined"
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
      <Box sx={{ width: '100%', mt: 1 }} justifyContent={'center'}>
        <LinearProgress variant="determinate" value={props.percent ?? 0} />
        {props.current !== null && (
          <Typography variant="caption" sx={{ mt: 1 }}>
            {infoText(props.current)} / {props.percent}%
          </Typography>
        )}
      </Box>
    </Stack>
  )
}
