import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DownloadIcon from '@mui/icons-material/Download'
import DownloadingIcon from '@mui/icons-material/Downloading'
import ErrorIcon from '@mui/icons-material/Error'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import AppTooltip from '@renderer/shared/components/ui/app-tooltip'
import React from 'react'

export default function DownloadsQueuePanel(props: {
  jobsTotal: number
  queuedCount: number
  runningCount: number
  completedCount: number
  failedCount: number

  queueLabel: string
  queueRunning: boolean
  queuePaused: boolean
  hasQueued: boolean
  canStart: boolean
  canPause: boolean
  hydrating: boolean

  showAdvanced: boolean
  onToggleAdvanced: () => void

  defaultType: 'video' | 'audio'
  onChangeDefaultType: (next: 'video' | 'audio') => void

  playlistLimit: number
  onChangePlaylistLimit: (next: number) => void

  onOpenDir: () => void
  onStartQueue: () => void
  onPauseQueue: () => void
}): React.JSX.Element {
  return (
    <Paper
      elevation={2}
      sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
        >
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <DownloadingIcon sx={{ fontSize: 28, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.125rem' }}>
                다운로드 관리
              </Typography>
            </Stack>

            <Chip
              size="medium"
              icon={
                props.queueRunning && !props.queuePaused ? (
                  <DownloadIcon sx={{ fontSize: 18 }} />
                ) : undefined
              }
              label={props.queueLabel}
              color={props.queueRunning && !props.queuePaused ? 'primary' : 'default'}
              variant={props.queueRunning && !props.queuePaused ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600, px: 2 }}
            />

            {props.hydrating ? (
              <Chip
                size="medium"
                variant="outlined"
                label="불러오는 중..."
                sx={{ fontWeight: 600 }}
              />
            ) : null}
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <AppTooltip title="다운로드 폴더 열기">
              <Button
                variant="outlined"
                startIcon={<FolderOpenIcon />}
                onClick={props.onOpenDir}
                sx={{ fontWeight: 600, borderRadius: 2, px: 2.5 }}
              >
                폴더 열기
              </Button>
            </AppTooltip>

            <AppTooltip title="설정 보기/숨기기">
              <IconButton
                size="medium"
                onClick={props.onToggleAdvanced}
                sx={{
                  bgcolor: props.showAdvanced ? 'action.selected' : 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <SettingsSuggestOutlinedIcon />
              </IconButton>
            </AppTooltip>
          </Stack>
        </Stack>

        {props.jobsTotal > 0 ? (
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Chip
              size="medium"
              label={`전체 ${props.jobsTotal}개`}
              variant="filled"
              sx={{ fontWeight: 600, px: 2 }}
            />
            {props.queuedCount > 0 ? (
              <Chip
                size="medium"
                icon={<DownloadIcon sx={{ fontSize: 16 }} />}
                label={`대기 ${props.queuedCount}개`}
                variant="outlined"
                sx={{ fontWeight: 600, px: 2 }}
              />
            ) : null}
            {props.runningCount > 0 ? (
              <Chip
                size="medium"
                icon={<DownloadingIcon sx={{ fontSize: 16 }} />}
                label={`진행중 ${props.runningCount}개`}
                variant="filled"
                color="info"
                sx={{ fontWeight: 600, px: 2 }}
              />
            ) : null}
            {props.completedCount > 0 ? (
              <Chip
                size="medium"
                icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                label={`완료 ${props.completedCount}개`}
                variant="filled"
                color="success"
                sx={{ fontWeight: 600, px: 2 }}
              />
            ) : null}
            {props.failedCount > 0 ? (
              <Chip
                size="medium"
                icon={<ErrorIcon sx={{ fontSize: 16 }} />}
                label={`실패 ${props.failedCount}개`}
                variant="filled"
                color="error"
                sx={{ fontWeight: 600, px: 2 }}
              />
            ) : null}
          </Stack>
        ) : null}

        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              size="small"
              label="2단계"
              color="primary"
              variant="filled"
              sx={{ fontWeight: 700 }}
            />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              다운로드 시작 또는 일시정지
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppTooltip
                fullWidth
                title={
                  !props.hasQueued
                    ? '먼저 위에서 영상 URL을 추가해주세요'
                    : props.queuePaused
                      ? '일시정지된 다운로드를 계속합니다'
                      : '대기중인 다운로드를 시작합니다'
                }
              >
                <Button
                  size="large"
                  variant="contained"
                  fullWidth
                  startIcon={<PlayArrowIcon sx={{ fontSize: 24 }} />}
                  disabled={!props.canStart}
                  onClick={props.onStartQueue}
                  sx={{
                    py: 1.75,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    borderRadius: 2,
                    boxShadow: 3,
                    '&:disabled': { bgcolor: 'action.disabledBackground' },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {props.queuePaused && props.hasQueued ? '계속하기' : '다운로드 시작'}
                </Button>
              </AppTooltip>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AppTooltip fullWidth title="진행중인 다운로드를 일시정지합니다">
                <Button
                  size="large"
                  variant="outlined"
                  fullWidth
                  startIcon={<PauseIcon sx={{ fontSize: 24 }} />}
                  disabled={!props.canPause}
                  onClick={props.onPauseQueue}
                  sx={{
                    py: 1.75,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    borderRadius: 2,
                    borderWidth: 2,
                    transition: 'all 0.3s ease'
                  }}
                >
                  일시정지
                </Button>
              </AppTooltip>
            </Box>
          </Stack>
        </Stack>

        <Collapse
          in={props.showAdvanced}
          unmountOnExit
          timeout={100}
          easing="ease-out"
          collapsedSize={0}
        >
          <Stack spacing={2}>
            <Divider />

            <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'pre-line' }}>
                💡 이 설정은 새로 추가되는 영상에만 적용됩니다.
              </Typography>
            </Alert>

            <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
              <Stack spacing={1.25}>
                <Typography variant="body2" fontWeight={700} color="text.secondary">
                  기본 다운로드 형식
                </Typography>

                <ToggleButtonGroup
                  size="medium"
                  exclusive
                  value={props.defaultType}
                  onChange={(_, v): void => {
                    if (!v) return
                    props.onChangeDefaultType(v)
                  }}
                  sx={{
                    '& .MuiToggleButton-root': {
                      px: 3,
                      py: 1.25,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      borderRadius: 2
                    }
                  }}
                >
                  <ToggleButton value="video">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <VideoLibraryIcon sx={{ fontSize: 20 }} />
                      <span>비디오 (영상+음성)</span>
                    </Stack>
                  </ToggleButton>
                  <ToggleButton value="audio">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AudiotrackIcon sx={{ fontSize: 20 }} />
                      <span>오디오만</span>
                    </Stack>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <Divider orientation="vertical" flexItem />

              <Stack spacing={1.25}>
                <Typography variant="body2" fontWeight={700} color="text.secondary">
                  플레이리스트 다운로드 개수
                </Typography>

                <ToggleButtonGroup
                  size="medium"
                  exclusive
                  value={String(props.playlistLimit)}
                  onChange={(_, v): void => {
                    if (!v) return
                    const n = Number(v)
                    if (!Number.isFinite(n)) return
                    props.onChangePlaylistLimit(n)
                  }}
                  sx={{
                    '& .MuiToggleButton-root': {
                      px: 3,
                      py: 1.25,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      borderRadius: 2
                    }
                  }}
                >
                  <ToggleButton value="10">10개</ToggleButton>
                  <ToggleButton value="20">20개</ToggleButton>
                  <ToggleButton value="40">40개</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  )
}
