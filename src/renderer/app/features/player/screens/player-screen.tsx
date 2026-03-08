import { Box, Typography } from '@mui/material'
import React from 'react'

export default function PlayerScreen(): React.JSX.Element {
  const hash = window.location.hash
  const searchParams = new URLSearchParams(hash.split('?')[1] || '')
  const videoSrc = searchParams.get('src') ?? ''

  const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement>): void => {
    const target = event.currentTarget
    console.error('[player] media load error', {
      src: videoSrc,
      error: target.error
    })
  }

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(180deg, #111 0%, #000 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
        WebkitAppRegion: 'no-drag'
      }}
    >
      {videoSrc ? (
        <>
          <Box
            component="video"
            src={videoSrc}
            onError={handleVideoError}
            controls
            autoPlay
            sx={{
              display: 'block',
              width: '100vw',
              height: '100vh',
              objectFit: 'cover',
              objectPosition: 'center center',
              border: 0,
              borderRadius: 0,
              boxShadow: 'none',
              backgroundColor: '#000',
              WebkitAppRegion: 'no-drag',
              pointerEvents: 'auto',
              zIndex: 1
            }}
          />
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: '#fff',
            textAlign: 'center',
            px: 3
          }}
        >
          <Typography variant="h6">재생할 파일이 없습니다.</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            player window를 열 때 src를 전달하도록 연결이 필요합니다.
          </Typography>
        </Box>
      )}
    </Box>
  )
}
