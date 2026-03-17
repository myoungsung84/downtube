import AudioFileRoundedIcon from '@mui/icons-material/AudioFileRounded'
import AutoAwesomeMosaicRoundedIcon from '@mui/icons-material/AutoAwesomeMosaicRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import MovieRoundedIcon from '@mui/icons-material/MovieRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import Thumbnail from '@renderer/shared/components/ui/thumbnail'
import { useToast } from '@renderer/shared/hooks/use-toast'
import type { LibraryItem, LibraryItemType } from '@src/types/library.types'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

function toMediaUrl(filePath?: string): string | undefined {
  if (!filePath) return undefined
  const url = new URL('downtube-media://media')
  url.searchParams.set('path', filePath)
  return url.toString()
}

function formatFileSize(fileSize: number): string {
  if (!Number.isFinite(fileSize) || fileSize <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = fileSize
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value >= 100 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

function formatDate(item: LibraryItem): string {
  const timestamp = item.downloadedAt ? Date.parse(item.downloadedAt) : item.createdAt

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(Number.isFinite(timestamp) ? timestamp : item.createdAt)
}

export default function LibraryScreen(): React.JSX.Element {
  const theme = useTheme()
  const { showToast } = useToast()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<LibraryItemType>('video')
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null)
  const [menuItem, setMenuItem] = useState<LibraryItem | null>(null)

  const videoItems = useMemo(() => items.filter((item) => item.type === 'video'), [items])
  const audioItems = useMemo(() => items.filter((item) => item.type === 'audio'), [items])
  const visibleItems = tab === 'video' ? videoItems : audioItems

  const loadItems = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial'): Promise<void> => {
      if (mode === 'refresh') setRefreshing(true)
      else setLoading(true)

      try {
        setItems(await window.api.listLibraryItems())
      } catch {
        showToast('라이브러리를 불러오지 못했습니다.', 'error')
      } finally {
        if (mode === 'refresh') setRefreshing(false)
        else setLoading(false)
      }
    },
    [showToast]
  )

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const handleOpenDownloadsFolder = async (): Promise<void> => {
    try {
      const result = await window.api.openDownloadDir()
      if (result && 'success' in result && !result.success) {
        showToast(result.message ?? '다운로드 폴더를 열지 못했습니다.', 'error')
      }
    } catch {
      showToast('다운로드 폴더를 열지 못했습니다.', 'error')
    }
  }

  const handleOpenDownloadsRoot = async (): Promise<void> => {
    const result = await window.api.openDownloadsRootDir()
    if (!result.success) {
      showToast(result.message ?? '루트 경로를 열지 못했습니다.', 'error')
    }
  }

  const handleOpenFileLocation = async (item: LibraryItem): Promise<void> => {
    const result = await window.api.openDownloadItem(item.filePath)
    if (!result.success) {
      showToast(result.message ?? '파일 위치를 열지 못했습니다.', 'error')
    }
  }

  const handleDelete = async (item: LibraryItem): Promise<void> => {
    const confirmed = window.confirm(
      `"${item.title ?? item.fileName}"을 라이브러리에서 삭제할까요?\n원본 파일과 연결된 메타데이터가 함께 삭제됩니다.`
    )
    if (!confirmed) return

    const result = await window.api.deleteLibraryItem(item.filePath)
    if (!result.success) {
      showToast(result.message ?? '삭제하지 못했습니다.', 'error')
      return
    }

    setItems((prev) => prev.filter((current) => current.filePath !== item.filePath))
    showToast('삭제했습니다.', 'success')
  }

  const handleOpenPlayer = async (item: LibraryItem): Promise<void> => {
    if (item.type !== 'video') return

    // TODO: 연속 재생 단계에서 현재 목록과 인덱스를 플레이어에 함께 전달한다.
    const result = await window.api.openPlayerFile(item.filePath)
    if (!result.success) {
      showToast(result.message ?? '플레이어를 열지 못했습니다.', 'error')
    }
  }

  const closeMenu = (): void => {
    setMenuAnchorEl(null)
    setMenuItem(null)
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack sx={{ width: '100%', maxWidth: 1400, p: 3 }} spacing={2.5}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            p: 2.5,
            background: (currentTheme) =>
              `linear-gradient(135deg, ${alpha(currentTheme.palette.primary.main, 0.05)}, ${alpha(
                currentTheme.palette.warning.main,
                0.06
              )})`
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="h5" fontWeight={900} letterSpacing="-0.03em">
                  라이브러리
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  완료된 항목만 모아 봅니다.
                </Typography>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                justifyContent="flex-end"
              >
                <Button
                  variant="outlined"
                  startIcon={
                    refreshing ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <RefreshRoundedIcon />
                    )
                  }
                  disabled={loading || refreshing}
                  onClick={() => void loadItems('refresh')}
                >
                  새로고침
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FolderOpenRoundedIcon />}
                  onClick={() => void handleOpenDownloadsFolder()}
                >
                  다운로드 폴더
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Inventory2OutlinedIcon />}
                  onClick={() => void handleOpenDownloadsRoot()}
                >
                  루트 경로
                </Button>
              </Stack>
            </Stack>

            <Tabs
              value={tab}
              onChange={(_, value: LibraryItemType) => setTab(value)}
              sx={{ minHeight: 40 }}
            >
              <Tab label={`비디오 ${videoItems.length}`} value="video" />
              <Tab label={`오디오 ${audioItems.length}`} value="audio" />
            </Tabs>
          </Stack>
        </Paper>

        {loading ? (
          <Paper
            elevation={0}
            sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', py: 8 }}
          >
            <Stack alignItems="center" spacing={1.5}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">
                불러오는 중
              </Typography>
            </Stack>
          </Paper>
        ) : visibleItems.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              px: 3,
              py: 7
            }}
          >
            <Stack alignItems="center" spacing={1.5}>
              <Stack
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.08)
                }}
              >
                {tab === 'video' ? (
                  <MovieRoundedIcon sx={{ fontSize: 34, color: 'primary.main' }} />
                ) : (
                  <AudioFileRoundedIcon sx={{ fontSize: 34, color: 'warning.main' }} />
                )}
              </Stack>
              <Typography fontWeight={700}>
                {tab === 'video' ? '비디오가 없습니다.' : '오디오가 없습니다.'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                다운로드가 끝나면 여기에 표시됩니다.
              </Typography>
            </Stack>
          </Paper>
        ) : (
          <Stack spacing={1.25}>
            {visibleItems.map((item) => {
              const isVideo = item.type === 'video'
              const thumbnailUrl = toMediaUrl(item.thumbnailPath)

              return (
                <Paper
                  key={item.id}
                  elevation={0}
                  onClick={isVideo ? () => void handleOpenPlayer(item) : undefined}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    cursor: isVideo ? 'pointer' : 'default',
                    transition:
                      'background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease',
                    '&:hover': isVideo
                      ? {
                          backgroundColor:
                            theme.palette.mode === 'light'
                              ? alpha(theme.palette.primary.main, 0.025)
                              : alpha(theme.palette.primary.main, 0.08),
                          borderColor: alpha(theme.palette.primary.main, 0.45),
                          boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.05)}`
                        }
                      : undefined
                  }}
                >
                  <Stack direction="row" sx={{ minHeight: 108 }}>
                    <Box sx={{ width: 176, flexShrink: 0, p: 1.25 }}>
                      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
                        {isVideo ? (
                          <Thumbnail
                            url={thumbnailUrl}
                            w="100%"
                            h="100%"
                            alt={item.title ?? item.fileName}
                            sx={{
                              borderRadius: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: alpha(theme.palette.common.black, 0.1)
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              borderRadius: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              display: 'grid',
                              placeItems: 'center',
                              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.16)}, ${alpha(theme.palette.primary.main, 0.08)})`
                            }}
                          >
                            <AutoAwesomeMosaicRoundedIcon
                              sx={{ fontSize: 34, color: 'warning.dark' }}
                            />
                          </Box>
                        )}

                        <Chip
                          size="small"
                          icon={isVideo ? <MovieRoundedIcon /> : <AudioFileRoundedIcon />}
                          label={isVideo ? '비디오' : '오디오'}
                          sx={{
                            position: 'absolute',
                            left: 8,
                            bottom: 8,
                            height: 24,
                            fontWeight: 700,
                            bgcolor: alpha(theme.palette.common.black, 0.72),
                            color: 'common.white',
                            '& .MuiChip-icon': {
                              color: 'inherit',
                              fontSize: 15
                            }
                          }}
                        />
                      </Box>
                    </Box>

                    <Stack sx={{ minWidth: 0, flex: 1, px: 2, py: 1.75 }} spacing={1.25}>
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="flex-start"
                        justifyContent="space-between"
                      >
                        <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            fontWeight={800}
                            sx={{ fontSize: '0.98rem', lineHeight: 1.35 }}
                            noWrap
                            title={item.title ?? item.fileName}
                          >
                            {item.title ?? item.fileName}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            title={item.uploader}
                          >
                            {item.uploader ?? '업로더 정보 없음'}
                          </Typography>
                        </Stack>

                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation()
                            setMenuAnchorEl(event.currentTarget)
                            setMenuItem(item)
                          }}
                        >
                          <MoreHorizRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Stack>

                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Chip size="small" variant="outlined" label={formatDate(item)} />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={formatFileSize(item.fileSize)}
                        />
                        <Chip size="small" variant="outlined" label={`.${item.extension}`} />
                        <Chip size="small" variant="outlined" label={item.fileName} />
                      </Stack>

                      <Typography variant="caption" color="text.secondary">
                        {isVideo ? '재생 가능' : '오디오는 아직 재생을 지원하지 않습니다.'}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              )
            })}
          </Stack>
        )}

        <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={closeMenu}>
          <MenuItem
            onClick={() => {
              const currentItem = menuItem
              closeMenu()
              if (currentItem) void handleOpenFileLocation(currentItem)
            }}
          >
            <FolderOpenRoundedIcon sx={{ mr: 1.25, fontSize: 18 }} />
            파일 위치 열기
          </MenuItem>
          <MenuItem
            onClick={() => {
              const currentItem = menuItem
              closeMenu()
              if (currentItem) void handleDelete(currentItem)
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteOutlineRoundedIcon sx={{ mr: 1.25, fontSize: 18 }} />
            삭제
          </MenuItem>
        </Menu>
      </Stack>
    </Box>
  )
}
