import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import React from 'react'

export function PlayerEmptyState(): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        color: 'common.white',
        textAlign: 'center',
        px: 3,
        width: '100%',
        height: '100%'
      }}
    >
      <Typography variant="h6">재생할 파일이 없습니다.</Typography>
      <Typography variant="body2" sx={{ color: (theme) => alpha(theme.palette.common.white, 0.5) }}>
        player window를 열 때 src를 전달하도록 연결이 필요합니다.
      </Typography>
    </Box>
  )
}
