import { Box, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import React from 'react'

import { IcFolder } from './player-icons'

type PlayerTopOverlayProps = {
  uiVisible: boolean
  fileExtension: string
  primaryText: string
  secondaryText?: string
  isAudioFile: boolean
  meta: { width: number; height: number }
  playbackRate: number
  onOpenFolder: () => void
  onChangePlaybackRate: (rate: number) => void
}

export function PlayerTopOverlay({
  uiVisible,
  fileExtension,
  primaryText,
  secondaryText,
  isAudioFile,
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
          opacity: uiVisible ? 1 : 0,
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
            alignItems: 'flex-start',
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
                backgroundColor: 'error.main',
                lineHeight: 1
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  color: 'common.white',
                  textTransform: 'uppercase',
                  lineHeight: 1.5
                }}
              >
                {isAudioFile ? `audio${fileExtension ? ` · ${fileExtension}` : ''}` : fileExtension}
              </Typography>
            </Box>
          )}
          <Stack spacing={0.15} sx={{ minWidth: 0 }}>
            <Typography
              title={primaryText}
              sx={{
                color: (theme) => alpha(theme.palette.common.white, 0.92),
                fontWeight: 600,
                fontSize: '0.88rem',
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textShadow: (theme) => `0 1px 6px ${alpha(theme.palette.common.black, 0.8)}`
              }}
            >
              {primaryText || '알 수 없는 파일'}
            </Typography>
            {secondaryText ? (
              <Typography
                title={secondaryText}
                sx={{
                  color: (theme) => alpha(theme.palette.common.white, 0.58),
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textShadow: (theme) => `0 1px 6px ${alpha(theme.palette.common.black, 0.8)}`
                }}
              >
                {secondaryText}
              </Typography>
            ) : null}
          </Stack>
          <Box
            component="button"
            onClick={onOpenFolder}
            title="폴더 열기"
            sx={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: (theme) => alpha(theme.palette.common.white, 0.08),
              border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
              backdropFilter: 'blur(6px)',
              color: (theme) => alpha(theme.palette.common.white, 0.6),
              cursor: 'pointer',
              px: '10px',
              py: '5px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'background 0.15s, color 0.15s',
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.common.white, 0.14),
                color: 'common.white'
              }
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
          opacity: uiVisible ? 1 : 0,
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
          {!isAudioFile && meta.width > 0 && meta.height > 0 && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 24,
                px: '10px',
                borderRadius: '6px',
                backgroundColor: (theme) => alpha(theme.palette.common.white, 0.08),
                border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
                backdropFilter: 'blur(6px)',
                mr: 0.5
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: (theme) => alpha(theme.palette.common.white, 0.6),
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
                  background: (theme) =>
                    isActive
                      ? alpha(theme.palette.error.main, 0.5)
                      : alpha(theme.palette.common.white, 0.07),
                  border: (theme) =>
                    `1px solid ${
                      isActive
                        ? alpha(theme.palette.error.main, 0.7)
                        : alpha(theme.palette.common.white, 0.1)
                    }`,
                  backdropFilter: 'blur(6px)',
                  color: (theme) =>
                    isActive ? theme.palette.common.white : alpha(theme.palette.common.white, 0.5),
                  cursor: 'pointer',
                  fontSize: '0.68rem',
                  fontWeight: isActive ? 800 : 600,
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                  '&:hover': {
                    backgroundColor: (theme) =>
                      isActive
                        ? alpha(theme.palette.error.main, 0.65)
                        : alpha(theme.palette.common.white, 0.13),
                    color: 'common.white'
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
