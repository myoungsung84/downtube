import { Box, Stack, Typography } from '@mui/material'
import React from 'react'

import { IcFolder } from './player-icons'

type PlayerTopOverlayProps = {
  uiVisible: boolean
  visualizerVisible: boolean
  fileExtension: string
  displayFileName: string
  meta: { width: number; height: number }
  playbackRate: number
  onOpenFolder: () => void
  onChangePlaybackRate: (rate: number) => void
}

export function PlayerTopOverlay({
  uiVisible,
  visualizerVisible,
  fileExtension,
  displayFileName,
  meta,
  playbackRate,
  onOpenFolder,
  onChangePlaybackRate
}: PlayerTopOverlayProps): React.JSX.Element {
  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          pointerEvents: uiVisible ? 'auto' : 'none',
          opacity: uiVisible ? 1 : 0.28,
          transition: 'opacity 0.5s ease',
          zIndex: 4
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 18,
            left: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: uiVisible ? 'auto' : 'none',
            maxWidth: '55%'
          }}
        >
          {fileExtension && (
            <Box
              sx={{
                flexShrink: 0,
                px: '8px',
                py: '3px',
                borderRadius: '5px',
                backgroundColor: '#e53935',
                lineHeight: 1
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  color: '#fff',
                  textTransform: 'uppercase',
                  lineHeight: 1.5
                }}
              >
                {fileExtension}
              </Typography>
            </Box>
          )}
          <Typography
            title={displayFileName}
            sx={{
              color: 'rgba(255,255,255,0.92)',
              fontWeight: 600,
              fontSize: '0.88rem',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 6px rgba(0,0,0,0.8)'
            }}
          >
            {displayFileName || '알 수 없는 파일'}
          </Typography>
          <Box
            component="button"
            onClick={onOpenFolder}
            title="폴더 열기"
            sx={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              backdropFilter: 'blur(6px)',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              px: '10px',
              py: '5px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'background 0.15s, color 0.15s',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.14)', color: '#fff' }
            }}
          >
            <IcFolder />
            폴더
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          pointerEvents: uiVisible ? 'auto' : 'none',
          opacity: uiVisible ? 1 : visualizerVisible ? 0.28 : 0,
          transition: 'opacity 0.5s ease',
          zIndex: 4
        }}
      >
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            pointerEvents: uiVisible ? 'auto' : 'none'
          }}
        >
          {meta.width > 0 && meta.height > 0 && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 24,
                px: '10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(6px)',
                mr: 0.5
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1
                }}
              >
                {meta.width} × {meta.height}
              </Typography>
            </Box>
          )}
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => {
            const isActive = playbackRate === rate
            return (
              <Box
                key={rate}
                component="button"
                onClick={() => onChangePlaybackRate(rate)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 24,
                  px: '9px',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(229,57,53,0.5)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${isActive ? 'rgba(229,57,53,0.7)' : 'rgba(255,255,255,0.1)'}`,
                  backdropFilter: 'blur(6px)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: '0.68rem',
                  fontWeight: isActive ? 800 : 600,
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                  '&:hover': {
                    backgroundColor: isActive ? 'rgba(229,57,53,0.65)' : 'rgba(255,255,255,0.13)',
                    color: '#fff'
                  }
                }}
              >
                {rate === 1 ? '1×' : `${rate}×`}
              </Box>
            )
          })}
        </Stack>
      </Box>
    </>
  )
}
