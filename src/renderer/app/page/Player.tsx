import { Box } from '@mui/material'
import React from 'react'

export default function Player(): React.JSX.Element {
  const hash = window.location.hash
  const searchParams = new URLSearchParams(hash.split('?')[1] || '')
  const url = searchParams.get('url') ?? ''

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}
    >
      <Box
        component="video"
        src={url}
        controls
        autoPlay
        sx={{
          width: '100%',
          maxWidth: '1280px',
          maxHeight: '100vh',
          aspectRatio: '16 / 9',
          border: 0,
          backgroundColor: '#000'
        }}
      />
    </Box>
  )
}
