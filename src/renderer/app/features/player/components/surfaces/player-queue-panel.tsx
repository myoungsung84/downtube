import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import React, { useEffect, useRef } from 'react'

import { getFileNameWithoutExtension } from '../../lib'
import type { PlayerQueueItem } from '../../types/player.types'
import { IcClose } from '../visuals/player-icons'

type PlayerQueuePanelProps = {
  open: boolean
  queue: PlayerQueueItem[]
  currentIndex: number
  onSelectIndex: (index: number) => void
  onClose: () => void
}

export function PlayerQueuePanel({
  open,
  queue,
  currentIndex,
  onSelectIndex,
  onClose
}: PlayerQueuePanelProps): React.JSX.Element {
  const { t } = useI18n('player')
  const currentItemRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      currentItemRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 120)
    return () => clearTimeout(timer)
  }, [open, currentIndex])

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 288,
        zIndex: 10,
        background: (theme) => alpha(theme.palette.common.black, 0.9),
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.09)}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        opacity: open ? 1 : 0,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'opacity 0.2s ease, transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: open ? 'auto' : 'none'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          pt: 2,
          pb: 1.5,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.07)}`
        }}
      >
        <Typography
          sx={{
            color: (theme) => alpha(theme.palette.common.white, 0.5),
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
            userSelect: 'none'
          }}
        >
          {t('queue_panel.title')}
          <Box
            component="span"
            sx={{ color: (theme) => alpha(theme.palette.common.white, 0.28), ml: '6px' }}
          >
            {queue.length}
          </Box>
        </Typography>
        <Box
          component="button"
          onClick={onClose}
          title={t('queue_panel.close')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: '1px solid transparent',
            color: (theme) => alpha(theme.palette.common.white, 0.35),
            cursor: 'pointer',
            p: '5px',
            borderRadius: '6px',
            transition: 'background 0.14s, color 0.14s',
            '&:hover': {
              background: (theme) => alpha(theme.palette.common.white, 0.1),
              color: (theme) => alpha(theme.palette.common.white, 0.8)
            }
          }}
        >
          <IcClose />
        </Box>
      </Box>

      {/* List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1,
          py: 1,
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: (theme) => alpha(theme.palette.common.white, 0.14),
            borderRadius: '2px'
          }
        }}
      >
        {queue.map((item, index) => {
          const isCurrent = index === currentIndex
          const label =
            item.title?.trim() || getFileNameWithoutExtension(item.fileName) || item.fileName || '–'

          return (
            <Box
              key={`${item.mediaPath}-${index}`}
              ref={isCurrent ? currentItemRef : null}
              onClick={() => {
                if (!isCurrent) onSelectIndex(index)
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: '9px',
                borderRadius: '7px',
                cursor: isCurrent ? 'default' : 'pointer',
                backgroundColor: (theme) =>
                  isCurrent ? alpha(theme.palette.error.main, 0.18) : 'transparent',
                border: (theme) =>
                  `1px solid ${isCurrent ? alpha(theme.palette.error.main, 0.3) : 'transparent'}`,
                mb: '2px',
                transition: 'background-color 0.12s, border-color 0.12s',
                '&:hover': isCurrent
                  ? undefined
                  : {
                      backgroundColor: (theme) => alpha(theme.palette.common.white, 0.07)
                    }
              }}
            >
              {/* Index / Now playing indicator */}
              <Box
                sx={{
                  width: 16,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isCurrent ? (
                  <Box
                    sx={{
                      color: (theme) => theme.palette.error.light,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor">
                      <path d="M0 0l8 5-8 5z" />
                    </svg>
                  </Box>
                ) : (
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '0.62rem',
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      color: (theme) => alpha(theme.palette.common.white, 0.3),
                      lineHeight: 1,
                      userSelect: 'none'
                    }}
                  >
                    {index + 1}
                  </Typography>
                )}
              </Box>

              {/* Track label */}
              <Typography
                title={label}
                sx={{
                  flex: 1,
                  fontSize: '0.78rem',
                  lineHeight: 1.35,
                  fontWeight: isCurrent ? 600 : 400,
                  color: (theme) =>
                    isCurrent
                      ? alpha(theme.palette.common.white, 0.95)
                      : alpha(theme.palette.common.white, 0.6),
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  userSelect: 'none'
                }}
              >
                {label}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
