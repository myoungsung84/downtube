import { Box } from '@mui/material'
import React from 'react'

type PlayerVideoSurfaceProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  src: string
  isAudioFile: boolean
  videoObjectFit: string
  onError: (event: React.SyntheticEvent<HTMLVideoElement>) => void
  onLoadedMetadata: () => void
  onCanPlay: () => void
  onPlay: () => void
  onPause: () => void
  onSeeked: () => void
  onTimeUpdate: () => void
  onClick: () => void
  onDoubleClick: () => void
}

export function PlayerVideoSurface({
  videoRef,
  src,
  isAudioFile,
  videoObjectFit,
  onError,
  onLoadedMetadata,
  onCanPlay,
  onPlay,
  onPause,
  onSeeked,
  onTimeUpdate,
  onClick,
  onDoubleClick
}: PlayerVideoSurfaceProps): React.JSX.Element {
  return (
    <Box
      component="video"
      ref={videoRef}
      src={src}
      onError={onError}
      onLoadedMetadata={onLoadedMetadata}
      onCanPlay={onCanPlay}
      onPlay={onPlay}
      onPause={onPause}
      onSeeked={onSeeked}
      onTimeUpdate={onTimeUpdate}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      autoPlay
      preload="metadata"
      sx={{
        display: 'block',
        position: 'absolute',
        inset: 0,
        width: isAudioFile ? 1 : '100%',
        height: isAudioFile ? 1 : '100%',
        objectFit: videoObjectFit,
        objectPosition: 'center',
        backgroundColor: 'common.black',
        WebkitAppRegion: 'no-drag',
        cursor: 'inherit',
        opacity: isAudioFile ? 0 : 1,
        pointerEvents: isAudioFile ? 'none' : 'auto',
        '&::-webkit-media-controls': { display: 'none !important' }
      }}
    />
  )
}
