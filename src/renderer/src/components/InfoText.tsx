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
    <Stack direction="row" alignItems="center" sx={{ width: '100%' }} spacing={1}>
      <Typography
        variant="caption"
        noWrap
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100px'
        }}
      >
        {uploder}
      </Typography>
      <Typography variant="caption">{secondToTime(duration)}</Typography>
      <Typography variant="caption">{formatCompactNumber(viewCount)}</Typography>
    </Stack>
  )
}
