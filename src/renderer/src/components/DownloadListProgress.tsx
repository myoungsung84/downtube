import { LinearProgress, Typography } from '@mui/material'

export type DownloadListProgressProps = {
  current: 'video' | 'audio' | 'complete' | 'init' | null
  percent: number | undefined
}

export default function DownloadListProgress({
  current,
  percent
}: DownloadListProgressProps): React.JSX.Element {
  const statusColor = (status: string): string => {
    switch (status) {
      case 'video':
      case 'audio':
      case 'complete':
      case 'init':
        return '#1976d2'
      default:
      case 'failed':
        return '#d32f2f'
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
  return (
    <>
      <LinearProgress variant="determinate" color="info" value={percent ?? 0} />
      {current !== null && (
        <Typography
          variant="caption"
          display={'block'}
          textAlign={'center'}
          sx={{ width: '100%', mt: 1, color: statusColor(current) }}
        >
          {infoText(current)} / {percent}%
        </Typography>
      )}
    </>
  )
}
