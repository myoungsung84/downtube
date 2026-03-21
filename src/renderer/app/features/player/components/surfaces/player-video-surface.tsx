import { Box } from '@mui/material'
import React from 'react'

type PlayerVideoSurfaceProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  src: string
  isAudioFile: boolean
  onError: (event: React.SyntheticEvent<HTMLVideoElement>) => void
  onLoadedMetadata: () => void
  onCanPlay: () => void
  onPlay: () => void
  onPause: () => void
  onEnded: () => void
  onSeeked: () => void
  onTimeUpdate: () => void
  onClick: () => void
  onDoubleClick: () => void
}

export function PlayerVideoSurface({
  videoRef,
  src,
  isAudioFile,
  onError,
  onLoadedMetadata,
  onCanPlay,
  onPlay,
  onPause,
  onEnded,
  onSeeked,
  onTimeUpdate,
  onClick,
  onDoubleClick
}: PlayerVideoSurfaceProps): React.JSX.Element {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: isAudioFile ? 'none' : 'auto',
        bgcolor: 'common.black'
      }}
    >
      <Box
        component="video"
        ref={videoRef}
        src={src}
        onError={onError}
        onLoadedMetadata={onLoadedMetadata}
        onCanPlay={onCanPlay}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onSeeked={onSeeked}
        onTimeUpdate={onTimeUpdate}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        autoPlay
        preload="metadata"
        sx={{
          display: 'block',
          width: isAudioFile ? 1 : '100%',
          height: isAudioFile ? 1 : '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
          backgroundColor: 'common.black',
          WebkitAppRegion: 'no-drag',
          cursor: 'inherit',
          opacity: isAudioFile ? 0 : 1,
          pointerEvents: isAudioFile ? 'none' : 'auto',
          '&::-webkit-media-controls': { display: 'none !important' }
        }}
      />
    </Box>
  )
}
