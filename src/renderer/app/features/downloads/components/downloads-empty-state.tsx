import DownloadIcon from '@mui/icons-material/Download'
import LinkIcon from '@mui/icons-material/Link'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import { alpha, Box, Fade, keyframes, Paper, Stack, Typography } from '@mui/material'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import React from 'react'

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`

export default function DownloadsEmptyState(): React.JSX.Element {
  const { t } = useI18n('downloads')
  const steps = [
    {
      icon: <LinkIcon sx={{ fontSize: 18 }} />,
      label: t('empty.steps.paste_url.title'),
      desc: t('empty.steps.paste_url.description')
    },
    {
      icon: <PlaylistAddIcon sx={{ fontSize: 18 }} />,
      label: t('empty.steps.add_to_list.title'),
      desc: t('empty.steps.add_to_list.description')
    },
    {
      icon: <RocketLaunchIcon sx={{ fontSize: 18 }} />,
      label: t('empty.steps.download_all.title'),
      desc: t('empty.steps.download_all.description')
    }
  ]

  return (
    <Fade in timeout={400}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 3.5 },
          textAlign: 'center',
          borderRadius: 4,
          border: '1.5px dashed',
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.25),
          background: (theme) =>
            `linear-gradient(160deg,
              ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.035 : 0.04)} 0%,
              ${alpha(theme.palette.background.paper, 1)} 50%,
              ${alpha(theme.palette.info.main, theme.palette.mode === 'light' ? 0.03 : 0.04)} 100%)`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: (theme) =>
              `radial-gradient(ellipse 60% 40% at 50% 0%, ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.05 : 0.06)}, transparent)`,
            pointerEvents: 'none'
          }
        }}
      >
        <Stack spacing={2.5} alignItems="center">
          {/* Icon */}
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              border: '2px solid',
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: `${slideUp} 0.4s ease both`
            }}
          >
            <DownloadIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          </Box>

          {/* Text */}
          <Stack spacing={0.5} alignItems="center">
            <Typography variant="h5" fontWeight={700}>
              {t('empty.title')}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                maxWidth: 600,
                lineHeight: 1.8,
                color: (theme) =>
                  alpha(theme.palette.text.secondary, theme.palette.mode === 'light' ? 0.92 : 1)
              }}
            >
              {t('empty.description.primary')}
              <br />
              {t('empty.description.secondary', { action: t('queue.actions.start') })}
            </Typography>
          </Stack>

          {/* Steps */}
          <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ width: '100%' }}>
            {steps.map((step) => (
              <Box
                key={step.label}
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: (theme) => alpha(theme.palette.divider, 0.8),
                  bgcolor: (theme) => alpha(theme.palette.background.default, 0.6),
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'default',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                    boxShadow: (theme) => `0 4px 14px ${alpha(theme.palette.primary.main, 0.1)}`
                  }
                }}
              >
                <Stack spacing={0.75} alignItems="center">
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 1.5,
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Typography variant="caption" fontWeight={700} color="text.primary">
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.4}>
                    {step.desc}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Fade>
  )
}
