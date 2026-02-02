import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Stack, Typography } from '@mui/material'
import { formatCompactNumber, secondToTime } from '@src/libs/utils'
import React from 'react'

export type InfoTextProps = {
  uploder?: string
  duration?: number
  viewCount?: number
}

export default function InfoText({
  uploder,
  duration,
  viewCount
}: InfoTextProps): React.JSX.Element {
  return (
    <Stack sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
        <PersonOutlineIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography
          variant="caption"
          noWrap
          sx={{
            color: 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {uploder ?? '알 수 없음'}
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <ScheduleOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled">
            {duration != null ? secondToTime(duration) : '--:--'}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          <VisibilityOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled">
            {viewCount != null ? formatCompactNumber(viewCount) : '-'}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  )
}
