import DownloadIcon from '@mui/icons-material/Download'
import LinkIcon from '@mui/icons-material/Link'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import { alpha, Box, Fade, keyframes, Paper, Stack, Typography } from '@mui/material'
import React from 'react'

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 1; }
`

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`

const steps = [
  {
    icon: <LinkIcon sx={{ fontSize: 18 }} />,
    label: 'URL 붙여넣기',
    desc: '유튜브 링크를 위 입력창에 붙여넣으세요'
  },
  {
    icon: <PlaylistAddIcon sx={{ fontSize: 18 }} />,
    label: '목록에 추가',
    desc: '여러 영상을 원하는 만큼 추가하세요'
  },
  {
    icon: <RocketLaunchIcon sx={{ fontSize: 18 }} />,
    label: '한 번에 다운로드',
    desc: '다운로드 시작 버튼으로 일괄 처리해요'
  }
]

export default function DownloadsEmptyState(): React.JSX.Element {
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
              ${alpha(theme.palette.primary.main, 0.04)} 0%,
              ${alpha(theme.palette.background.paper, 1)} 50%,
              ${alpha(theme.palette.info.main, 0.04)} 100%)`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: (theme) =>
              `radial-gradient(ellipse 60% 40% at 50% 0%, ${alpha(theme.palette.primary.main, 0.06)}, transparent)`,
            pointerEvents: 'none'
          }
        }}
      >
        <Stack spacing={2.5} alignItems="center">
          {/* Icon */}
          <Box sx={{ position: 'relative', animation: `${slideUp} 0.5s ease both` }}>
            <Box
              sx={{
                position: 'absolute',
                inset: -8,
                borderRadius: '50%',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                animation: `${pulse} 2.8s ease-in-out infinite`
              }}
            />
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
                position: 'relative',
                animation: `${float} 3.5s ease-in-out infinite`
              }}
            >
              <DownloadIcon sx={{ fontSize: 36, color: 'primary.main' }} />
            </Box>
          </Box>

          {/* Text */}
          <Stack
            spacing={0.5}
            alignItems="center"
            sx={{ animation: `${slideUp} 0.5s 0.1s ease both`, opacity: 0 }}
          >
            <Typography variant="h6" fontWeight={800} letterSpacing={-0.5}>
              다운로드할 영상을 추가해보세요 🎬
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 400, lineHeight: 1.6 }}
            >
              유튜브 URL을 붙여넣고 여러 영상을 모아 한 번에 다운로드하세요.
            </Typography>
          </Stack>

          {/* Steps */}
          <Stack
            direction="row"
            spacing={1.5}
            justifyContent="center"
            sx={{
              width: '100%',
              animation: `${slideUp} 0.5s 0.2s ease both`,
              opacity: 0
            }}
          >
            {steps.map((step, i) => (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: (theme) => alpha(theme.palette.divider, 0.8),
                  bgcolor: (theme) => alpha(theme.palette.background.default, 0.6),
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                    transform: 'translateY(-2px)',
                    boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette.primary.main, 0.12)}`
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
