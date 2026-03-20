import { Box, Typography } from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import Thumbnail from '@renderer/shared/components/ui/thumbnail'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import React from 'react'

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0px rgba(255,255,255,0.08), 0 18px 42px rgba(0,0,0,0.35); }
  50%       { box-shadow: 0 0 0 6px rgba(255,255,255,0.10), 0 18px 42px rgba(0,0,0,0.35); }
`

const spinSlow = keyframes`
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
`

type AudioPlayerPanelProps = {
  paused: boolean
  visualizerVisible: boolean
  thumbnailSrc?: string
  primaryText: string
  secondaryText?: string
  upperFileExtension: string
  onTogglePlay: () => void
}

function AudioThumbnailFallback({ size = 145 }: { size?: number }): React.JSX.Element {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backgroundColor: (theme) => alpha(theme.palette.common.white, 0.05),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg
        width={size * 0.42}
        height={size * 0.42}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.35 }}
      >
        <path
          d="M18 36V12l22-4v8L26 18v18a6 6 0 1 1-8 0ZM12 42a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z"
          fill="white"
        />
      </svg>
    </Box>
  )
}

function PlayerBackgroundLayer({
  thumbnailSrc
}: {
  thumbnailSrc?: string
}): React.JSX.Element | null {
  if (!thumbnailSrc) return null

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: -24,
          backgroundImage: `url("${thumbnailSrc}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 28%',
          filter: 'blur(24px)',
          transform: 'scale(1.08)',
          opacity: 0.28
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: (theme) =>
            `linear-gradient(180deg, ${alpha(theme.palette.common.black, 0.36)} 0%, ${alpha(
              theme.palette.common.black,
              0.58
            )} 100%)`
        }}
      />
    </Box>
  )
}

export function AudioPlayerPanel({
  paused,
  visualizerVisible,
  thumbnailSrc,
  primaryText,
  secondaryText,
  upperFileExtension,
  onTogglePlay
}: AudioPlayerPanelProps): React.JSX.Element {
  const { t } = useI18n('player')
  return (
    <>
      <PlayerBackgroundLayer thumbnailSrc={thumbnailSrc} />

      {/* Clickable surface: covers the full audio background area, excluding controls overlay */}
      <Box
        onClick={onTogglePlay}
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          zIndex: 2,
          cursor: 'pointer'
        }}
      >
        <Box
          onClick={(e) => {
            e.stopPropagation()
            onTogglePlay()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onTogglePlay()
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={paused ? t('audio_panel.aria.play') : t('audio_panel.aria.pause')}
          sx={{
            width: 'min(100%, 560px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            px: { xs: 2.5, sm: 3 },
            py: { xs: 3.5, sm: 4 },
            borderRadius: 3,
            background: (theme) =>
              `radial-gradient(circle at top, ${alpha(theme.palette.error.main, 0.12)} 0%, transparent 48%), ${alpha(theme.palette.common.black, 0.42)}`,
            border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
            backdropFilter: 'blur(18px)',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <Box
            sx={{
              cursor: 'pointer',
              position: 'relative',
              width: { xs: 220, sm: 260 },
              height: { xs: 220, sm: 260 },
              flexShrink: 0
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                animation: !paused ? `${spinSlow} 5s linear infinite` : 'none',
                animationPlayState: paused ? 'paused' : 'running',
                zIndex: 0,
                background: `
                  radial-gradient(circle at 50% 50%,
                    #1a1a1a 0%,
                    #1a1a1a 21%,
                    #2e2e2e 22%,
                    #111 24%,
                    #2a2a2a 26%,
                    #111 28%,
                    #252525 30%,
                    #111 32%,
                    #222 34%,
                    #0e0e0e 36%,
                    #252525 38%,
                    #111 40%,
                    #222 42%,
                    #111 44%,
                    #1e1e1e 46%,
                    #0a0a0a 48%,
                    #1a1a1a 50%,
                    #0e0e0e 52%,
                    #1c1c1c 54%,
                    #0a0a0a 56%,
                    #181818 58%,
                    #0c0c0c 60%,
                    #161616 62%,
                    #0a0a0a 64%,
                    #141414 66%,
                    #080808 68%,
                    #121212 70%,
                    #080808 100%
                  )
                `,
                boxShadow: '0 16px 48px rgba(0,0,0,0.85), 0 2px 8px rgba(0,0,0,0.5)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#0a0a0a',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  zIndex: 3
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: `
                    conic-gradient(
                      from 0deg,
                      rgba(255,255,255,0.0)  0deg,
                      rgba(255,255,255,0.06) 30deg,
                      rgba(255,255,255,0.0)  60deg,
                      rgba(255,255,255,0.08) 100deg,
                      rgba(255,255,255,0.0)  140deg,
                      rgba(255,255,255,0.05) 180deg,
                      rgba(255,255,255,0.0)  210deg,
                      rgba(255,255,255,0.07) 250deg,
                      rgba(255,255,255,0.0)  290deg,
                      rgba(255,255,255,0.06) 330deg,
                      rgba(255,255,255,0.0)  360deg
                    )
                  `,
                  zIndex: 1
                }
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
                borderRadius: '50%',
                overflow: 'hidden',
                width: { xs: 124, sm: 145 },
                height: { xs: 124, sm: 145 },
                animation: !paused ? `${pulseGlow} 2.4s ease-in-out infinite` : 'none',
                opacity: paused ? 0.72 : 1,
                transition: 'opacity 0.25s ease',
                boxShadow: '0 0 0 3px rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.6)',
                '&:hover': { opacity: 0.88 }
              }}
            >
              {thumbnailSrc ? (
                <Thumbnail
                  url={thumbnailSrc}
                  w="100%"
                  h="100%"
                  alt={primaryText}
                  sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <AudioThumbnailFallback size={145} />
              )}
            </Box>
          </Box>

          <Box
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              backgroundColor: (theme) => alpha(theme.palette.error.main, 0.18),
              color: 'common.white',
              display: 'flex',
              alignItems: 'center',
              gap: 0.75
            }}
          >
            {visualizerVisible ? (
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: 'error.main',
                  boxShadow: (theme) => `0 0 6px 2px ${alpha(theme.palette.error.main, 0.7)}`,
                  animation: `${pulseGlow} 1.2s ease-in-out infinite`
                }}
              />
            ) : null}
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.08em' }}>
              {upperFileExtension ? `AUDIO · ${upperFileExtension}` : 'AUDIO'}
            </Typography>
          </Box>

          <Box sx={{ minWidth: 0, width: '100%' }}>
            <Typography
              title={primaryText}
              sx={{
                color: 'common.white',
                fontSize: { xs: '1.05rem', sm: '1.25rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {primaryText}
            </Typography>
            {secondaryText ? (
              <Typography
                title={secondaryText}
                sx={{
                  mt: 0.5,
                  color: (theme) => alpha(theme.palette.common.white, 0.6),
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {secondaryText}
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Box>
    </>
  )
}
