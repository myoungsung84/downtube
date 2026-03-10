import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import React from 'react'

import { PlayerBottomControls } from './player-bottom-controls'
import { PlayerCenterControls } from './player-center-controls'
import { PlayerSeekbar } from './player-seekbar'
import { PlayerTopOverlay } from './player-top-overlay'

type PlayerControlsProps = {
  uiVisible: boolean
  visualizerVisible: boolean
  paused: boolean
  playbackRate: number
  meta: { width: number; height: number; duration: number }
  fileExtension: string
  displayFileName: string
  hoverTime: number | null
  hoverX: number
  currentSeekVal: number
  muted: boolean
  volume: number
  isFullscreen: boolean
  seekbarRef: React.RefObject<HTMLDivElement | null>
  seekSliderSx: SxProps<Theme>
  volSliderSx: SxProps<Theme>
  formatSeconds: (seconds: number) => string
  onOpenFolder: () => void
  onChangePlaybackRate: (rate: number) => void
  onReplay10: () => void
  onTogglePlay: () => void
  onForward10: () => void
  onSeekbarMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void
  onSeekbarMouseLeave: () => void
  onSeekChange: (_: Event, val: number | number[]) => void
  onSeekCommit: (_: React.SyntheticEvent | Event, val: number | number[]) => void
  onToggleMute: () => void
  onVolumeChange: (_: Event, val: number | number[]) => void
  onToggleVisualizer: () => void
  onToggleFullscreen: () => void
}

export function PlayerControls({
  uiVisible,
  visualizerVisible,
  paused,
  playbackRate,
  meta,
  fileExtension,
  displayFileName,
  hoverTime,
  hoverX,
  currentSeekVal,
  muted,
  volume,
  isFullscreen,
  seekbarRef,
  seekSliderSx,
  volSliderSx,
  formatSeconds,
  onOpenFolder,
  onChangePlaybackRate,
  onReplay10,
  onTogglePlay,
  onForward10,
  onSeekbarMouseMove,
  onSeekbarMouseLeave,
  onSeekChange,
  onSeekCommit,
  onToggleMute,
  onVolumeChange,
  onToggleVisualizer,
  onToggleFullscreen
}: PlayerControlsProps): React.JSX.Element {
  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 3
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 160,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 3
        }}
      />

      <PlayerTopOverlay
        uiVisible={uiVisible}
        visualizerVisible={visualizerVisible}
        fileExtension={fileExtension}
        displayFileName={displayFileName}
        meta={{ width: meta.width, height: meta.height }}
        playbackRate={playbackRate}
        onOpenFolder={onOpenFolder}
        onChangePlaybackRate={onChangePlaybackRate}
      />

      <PlayerCenterControls
        uiVisible={uiVisible}
        paused={paused}
        onReplay10={onReplay10}
        onTogglePlay={onTogglePlay}
        onForward10={onForward10}
      />

      <PlayerSeekbar
        uiVisible={uiVisible}
        visualizerVisible={visualizerVisible}
        seekbarRef={seekbarRef}
        hoverTime={hoverTime}
        hoverX={hoverX}
        duration={meta.duration}
        currentSeekVal={currentSeekVal}
        onSeekbarMouseMove={onSeekbarMouseMove}
        onSeekbarMouseLeave={onSeekbarMouseLeave}
        onSeekChange={onSeekChange}
        onSeekCommit={onSeekCommit}
        formatSeconds={formatSeconds}
        seekSliderSx={seekSliderSx}
      />

      <PlayerBottomControls
        uiVisible={uiVisible}
        visualizerVisible={visualizerVisible}
        muted={muted}
        volume={volume}
        currentSeekVal={currentSeekVal}
        duration={meta.duration}
        isFullscreen={isFullscreen}
        onToggleMute={onToggleMute}
        onVolumeChange={onVolumeChange}
        onToggleVisualizer={onToggleVisualizer}
        onToggleFullscreen={onToggleFullscreen}
        formatSeconds={formatSeconds}
        volSliderSx={volSliderSx}
      />
    </>
  )
}
