import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import React from 'react'

import type { PlayerQueueItem, PlayerRepeatMode } from '../../types/player.types'
import { PlayerQueuePanel } from '../surfaces/player-queue-panel'
import { PlayerBottomControls } from './player-bottom-controls'
import { PlayerCenterControls } from './player-center-controls'
import { PlayerSeekbar } from './player-seekbar'
import { PlayerTopOverlay } from './player-top-overlay'

type PlayerControlsProps = {
  uiVisible: boolean
  visualizerVisible: boolean
  ambientParticlesEnabled: boolean
  queuePanelOpen: boolean
  paused: boolean
  playbackRate: number
  isAudioFile: boolean
  meta: { width: number; height: number; duration: number }
  fileExtension: string
  primaryText: string
  secondaryText?: string
  hoverTime: number | null
  hoverX: number
  currentSeekVal: number
  muted: boolean
  volume: number
  currentIndex: number
  queueLength: number
  queue: PlayerQueueItem[]
  repeatMode: PlayerRepeatMode
  isFullscreen: boolean
  canGoPrevious: boolean
  canGoNext: boolean
  nextItemLabel?: string
  seekbarRef: React.RefObject<HTMLDivElement | null>
  volSliderSx: SxProps<Theme>
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
  onVolumeCommit: (_: React.SyntheticEvent | Event, val: number | number[]) => void
  onPreviousTrack: () => void
  onNextTrack: () => void
  onCycleRepeatMode: () => void
  onToggleVisualizer: () => void
  onToggleAmbientParticles: () => void
  onToggleQueuePanel: () => void
  onQueueItemClick: (index: number) => void
  onToggleFullscreen: () => void
}

export function PlayerControls({
  uiVisible,
  visualizerVisible,
  ambientParticlesEnabled,
  queuePanelOpen,
  paused,
  playbackRate,
  isAudioFile,
  meta,
  fileExtension,
  primaryText,
  secondaryText,
  hoverTime,
  hoverX,
  currentSeekVal,
  muted,
  volume,
  currentIndex,
  queueLength,
  queue,
  repeatMode,
  isFullscreen,
  canGoPrevious,
  canGoNext,
  nextItemLabel,
  seekbarRef,
  volSliderSx,
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
  onVolumeCommit,
  onPreviousTrack,
  onNextTrack,
  onCycleRepeatMode,
  onToggleVisualizer,
  onToggleAmbientParticles,
  onToggleQueuePanel,
  onQueueItemClick,
  onToggleFullscreen
}: PlayerControlsProps): React.JSX.Element {
  return (
    <>
      {/* Top gradient */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          background: (theme) =>
            `linear-gradient(to bottom, ${alpha(theme.palette.common.black, 0.92)} 0%, transparent 100%)`,
          pointerEvents: 'none',
          opacity: uiVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
          zIndex: 3
        }}
      />

      {/* Bottom gradient */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 160,
          background: (theme) =>
            `linear-gradient(to top, ${alpha(theme.palette.common.black, 0.96)} 0%, ${alpha(
              theme.palette.common.black,
              0.55
            )} 60%, transparent 100%)`,
          pointerEvents: 'none',
          opacity: uiVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
          zIndex: 3
        }}
      />

      <PlayerTopOverlay
        uiVisible={uiVisible}
        fileExtension={fileExtension}
        primaryText={primaryText}
        secondaryText={secondaryText}
        isAudioFile={isAudioFile}
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
        uiVisible={uiVisible || visualizerVisible}
        seekbarRef={seekbarRef}
        hoverTime={hoverTime}
        hoverX={hoverX}
        duration={meta.duration}
        currentSeekVal={currentSeekVal}
        onSeekbarMouseMove={onSeekbarMouseMove}
        onSeekbarMouseLeave={onSeekbarMouseLeave}
        onSeekChange={onSeekChange}
        onSeekCommit={onSeekCommit}
      />

      <PlayerBottomControls
        uiVisible={uiVisible}
        visualizerVisible={visualizerVisible}
        ambientParticlesEnabled={ambientParticlesEnabled}
        queuePanelOpen={queuePanelOpen}
        muted={muted}
        volume={volume}
        currentSeekVal={currentSeekVal}
        duration={meta.duration}
        currentIndex={currentIndex}
        queueLength={queueLength}
        repeatMode={repeatMode}
        isFullscreen={isFullscreen}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        nextItemLabel={nextItemLabel}
        onToggleMute={onToggleMute}
        onVolumeChange={onVolumeChange}
        onVolumeCommit={onVolumeCommit}
        onPreviousTrack={onPreviousTrack}
        onNextTrack={onNextTrack}
        onCycleRepeatMode={onCycleRepeatMode}
        onToggleVisualizer={onToggleVisualizer}
        onToggleAmbientParticles={onToggleAmbientParticles}
        onToggleQueuePanel={onToggleQueuePanel}
        onToggleFullscreen={onToggleFullscreen}
        volSliderSx={volSliderSx}
      />

      {/* Queue panel backdrop: closes panel when clicking outside */}
      {queuePanelOpen && (
        <Box
          onClick={onToggleQueuePanel}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 288,
            bottom: 0,
            zIndex: 9,
            cursor: 'default'
          }}
        />
      )}

      {/* Queue panel */}
      <PlayerQueuePanel
        open={queuePanelOpen}
        queue={queue}
        currentIndex={currentIndex}
        onSelectIndex={onQueueItemClick}
        onClose={onToggleQueuePanel}
      />
    </>
  )
}
