import { Box, LinearProgress, Stack } from '@mui/material'
import * as React from 'react'

const borderSubtle = '1px solid rgba(255,255,255,0.06)'

const shimmer = {
  background:
    'linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 37%, rgba(255,255,255,0.06) 63%)',
  backgroundSize: '400% 100%',
  animation: 'shimmer 1.4s ease infinite'
}

export default function DownloadItemSkeleton(): React.JSX.Element {
  return (
    <Stack sx={{ p: 1, borderBottom: borderSubtle }}>
      <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ minHeight: '104px' }}>
        {/* Thumbnail */}
        <Box
          sx={{
            width: 180,
            height: 104,
            borderRadius: 1,
            ...shimmer,
            flexShrink: 0
          }}
        />

        {/* Right content */}
        <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ height: 16, width: '70%', borderRadius: 999, ...shimmer }} />
          <Box sx={{ height: 12, width: '45%', borderRadius: 999, ...shimmer }} />
          <Box sx={{ height: 12, width: '35%', borderRadius: 999, ...shimmer }} />

          <Box sx={{ height: 28, width: 96, borderRadius: 1, ...shimmer }} />
        </Stack>
      </Stack>

      {/* progress area = indeterminate bar */}
      <Box sx={{ mt: 1 }}>
        <LinearProgress
          variant="indeterminate"
          sx={{
            height: 6,
            borderRadius: 999,
            bgcolor: 'rgba(255,255,255,0.08)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: 'rgba(255,255,255,0.25)'
            }
          }}
        />
      </Box>
    </Stack>
  )
}
