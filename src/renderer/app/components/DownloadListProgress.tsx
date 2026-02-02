import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import HeadphonesOutlinedIcon from '@mui/icons-material/HeadphonesOutlined'
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined'
import { LinearProgress, Stack, Typography } from '@mui/material'
import React from 'react'

export type DownloadListProgressProps = {
  current: 'video' | 'audio' | 'complete' | 'init' | null
  percent: number | undefined
}

function getMeta(cur: DownloadListProgressProps['current']): {
  label: string
  icon: React.ReactNode
  colorKey: 'info.main' | 'success.main' | 'text.secondary'
} {
  switch (cur) {
    case 'video':
      return {
        label: '비디오 다운로드 중',
        icon: <MovieOutlinedIcon sx={{ fontSize: 14 }} />,
        colorKey: 'info.main'
      }
    case 'audio':
      return {
        label: '오디오 다운로드 중',
        icon: <HeadphonesOutlinedIcon sx={{ fontSize: 14 }} />,
        colorKey: 'info.main'
      }
    case 'complete':
      return {
        label: '다운로드 완료',
        icon: <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 14 }} />,
        colorKey: 'success.main'
      }
    case 'init':
      return {
        label: '초기화 중…',
        icon: <AutorenewOutlinedIcon sx={{ fontSize: 14 }} />,
        colorKey: 'text.secondary'
      }
    default:
      return { label: '', icon: null, colorKey: 'text.secondary' }
  }
}

export default function DownloadListProgress({
  current,
  percent
}: DownloadListProgressProps): React.JSX.Element {
  const meta = getMeta(current)

  // determinate는 0~100 필요
  const value =
    current === 'complete'
      ? 100
      : typeof percent === 'number' && Number.isFinite(percent)
        ? Math.max(0, Math.min(100, percent))
        : 0

  const showText = current !== null && meta.label !== ''

  return (
    <Stack spacing={1}>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 6,
          borderRadius: 999,
          bgcolor: 'rgba(255,255,255,0.08)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 999
          }
        }}
        // color prop은 단순 팔레트 키만 받기 때문에, bar 색은 sx로 처리하는 게 깔끔
      />

      {showText ? (
        <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center">
          <Typography
            variant="caption"
            sx={{ color: meta.colorKey, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            {meta.icon}
            {meta.label}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {typeof percent === 'number' ? `${Math.round(value)}%` : ''}
          </Typography>
        </Stack>
      ) : null}
    </Stack>
  )
}
