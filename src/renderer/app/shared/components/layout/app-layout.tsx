import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import NavigationBar from '@renderer/shared/components/ui/navigation-bar'
import React from 'react'

export default function AppLayout(props: {
  children: React.ReactNode
  showNav?: boolean
  onDirectory?: () => void
}): React.JSX.Element {
  const showNav = props.showNav ?? true

  return (
    <Box
      sx={{
        height: '100svh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {showNav ? (
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: (theme) => theme.zIndex.appBar,
            flexShrink: 0,
            backdropFilter: 'blur(10px)',
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? alpha(theme.palette.background.paper, 0.78)
                : alpha(theme.palette.background.default, 0.5),
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <NavigationBar onDirectory={props.onDirectory} />
        </Box>
      ) : null}

      <Box sx={{ flex: 1, overflow: 'auto', scrollbarGutter: 'stable' }}>{props.children}</Box>
    </Box>
  )
}
