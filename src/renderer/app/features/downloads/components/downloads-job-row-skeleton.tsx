import { Paper, Skeleton, Stack } from '@mui/material'
import React from 'react'

export default function DownloadsJobRowSkeleton(): React.JSX.Element {
  return (
    <Paper
      elevation={2}
      sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2.5} alignItems="center" justifyContent="space-between">
          <Stack spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Skeleton variant="rounded" width={72} height={72} sx={{ borderRadius: 2 }} />
              <Stack spacing={0.75} sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Skeleton variant="circular" width={22} height={22} />
                  <Skeleton variant="text" width="60%" height={28} />
                  <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: 1.5 }} />
                </Stack>
                <Skeleton variant="text" width="50%" height={20} sx={{ ml: 3.5 }} />
                <Skeleton variant="text" width="40%" height={18} sx={{ ml: 3.5 }} />
              </Stack>
            </Stack>
          </Stack>

          <Stack spacing={1.5} alignItems="flex-end">
            <Skeleton variant="rounded" width={100} height={32} />
            <Stack direction="row" spacing={1}>
              <Skeleton variant="circular" width={36} height={36} />
              <Skeleton variant="circular" width={36} height={36} />
              <Skeleton variant="circular" width={36} height={36} />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  )
}
