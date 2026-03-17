import AudioFileRoundedIcon from '@mui/icons-material/AudioFileRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import MovieRoundedIcon from '@mui/icons-material/MovieRounded'
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import Thumbnail from '@renderer/shared/components/ui/thumbnail'
import { useToast } from '@renderer/shared/hooks/use-toast'
import type { LibraryItem, LibraryItemType } from '@src/types/library.types'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// ─── types ────────────────────────────────────────────────────────────────────

type MenuState =
  | { phase: 'idle' }
  | { phase: 'open'; anchorEl: HTMLElement; item: LibraryItem }
  | { phase: 'confirmDelete'; anchorEl: HTMLElement; item: LibraryItem }

// ─── SegmentedControl ─────────────────────────────────────────────────────────

interface SegmentedControlProps {
  value: LibraryItemType
  onChange: (value: LibraryItemType) => void
  videoCnt: number
  audioCnt: number
}

function SegmentedControl({
  value,
  onChange,
  videoCnt,
  audioCnt
}: SegmentedControlProps): React.JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const segments: { key: LibraryItemType; label: string; count: number }[] = [
    { key: 'video', label: '비디오', count: videoCnt },
    { key: 'audio', label: '오디오', count: audioCnt }
  ]

  return (
    <Box
      sx={{
        display: 'inline-flex',
        borderRadius: 1.25,
        p: '3px',
        bgcolor: isDark
          ? alpha(theme.palette.common.black, 0.4)
          : alpha(theme.palette.common.black, 0.07),
        border: '1px solid',
        borderColor: isDark
          ? alpha(theme.palette.common.white, 0.07)
          : alpha(theme.palette.common.black, 0.1),
        gap: '2px'
      }}
    >
      {segments.map(({ key, label, count }) => {
        const active = value === key
        const accentColor =
          key === 'video' ? theme.palette.primary.main : theme.palette.warning.main

        return (
          <Box
            key={key}
            component="button"
            onClick={() => onChange(key)}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.65,
              px: 1.5,
              py: 0.6,
              borderRadius: 0.9,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.78rem',
              fontWeight: active ? 700 : 500,
              letterSpacing: active ? '-0.01em' : 0,
              color: active
                ? accentColor
                : isDark
                  ? alpha(theme.palette.common.white, 0.45)
                  : theme.palette.text.secondary,
              bgcolor: active
                ? isDark
                  ? alpha(accentColor, 0.16)
                  : theme.palette.background.paper
                : 'transparent',
              boxShadow:
                active && !isDark
                  ? `0 1px 4px ${alpha(theme.palette.common.black, 0.1)}, 0 0 0 0.5px ${alpha(theme.palette.common.black, 0.06)}`
                  : 'none',
              transition: 'color 150ms, background-color 150ms, box-shadow 150ms',
              '&:hover': !active
                ? {
                    color: isDark
                      ? alpha(theme.palette.common.white, 0.7)
                      : theme.palette.text.primary,
                    bgcolor: isDark
                      ? alpha(theme.palette.common.white, 0.06)
                      : alpha(theme.palette.common.black, 0.04)
                  }
                : {}
            }}
          >
            {label}
            <Box
              component="span"
              sx={{
                minWidth: 18,
                textAlign: 'center',
                px: 0.55,
                borderRadius: 0.5,
                fontSize: '0.63rem',
                fontWeight: 700,
                lineHeight: 1.65,
                bgcolor: active
                  ? alpha(accentColor, isDark ? 0.22 : 0.12)
                  : alpha(theme.palette.text.secondary, 0.1),
                color: active ? accentColor : 'text.disabled',
                transition: 'background-color 150ms, color 150ms'
              }}
            >
              {count}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

// ─── LibraryScreen ────────────────────────────────────────────────────────────

export default function LibraryScreen(): React.JSX.Element {
  const theme = useTheme()
  const { showToast } = useToast()
  const isDark = theme.palette.mode === 'dark'

  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<LibraryItemType>('video')
  const [menuState, setMenuState] = useState<MenuState>({ phase: 'idle' })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const videoItems = useMemo(() => items.filter((i) => i.type === 'video'), [items])
  const audioItems = useMemo(() => items.filter((i) => i.type === 'audio'), [items])
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

  const handleOpenFileLocation = async (item: LibraryItem): Promise<void> => {
    const result = await window.api.openDownloadItem(item.filePath)
    if (!result.success) showToast(result.message ?? '파일 위치를 열지 못했습니다.', 'error')
  }

  const handleDelete = async (item: LibraryItem): Promise<void> => {
    setDeletingId(item.id)
    closeMenu()
    const result = await window.api.deleteLibraryItem(item.filePath)
    setDeletingId(null)
    if (!result.success) {
      showToast(result.message ?? '삭제하지 못했습니다.', 'error')
      return
    }
    setItems((prev) => prev.filter((c) => c.filePath !== item.filePath))
    showToast('삭제했습니다.', 'success')
  }

  const handleOpenPlayer = async (item: LibraryItem): Promise<void> => {
    if (item.type !== 'video') return
    const result = await window.api.openPlayerFile(item.filePath)
    if (!result.success) showToast(result.message ?? '플레이어를 열지 못했습니다.', 'error')
  }

  const closeMenu = (): void => setMenuState({ phase: 'idle' })

  const isMenuOpen = menuState.phase === 'open' || menuState.phase === 'confirmDelete'
  const menuAnchorEl = isMenuOpen ? menuState.anchorEl : null
  const menuItem = isMenuOpen ? menuState.item : null

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack sx={{ width: '100%', maxWidth: 1400, p: 3 }} spacing={1.75}>
        {/* ── 헤더 패널 ─────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: isDark
              ? alpha(theme.palette.common.white, 0.08)
              : alpha(theme.palette.common.black, 0.1),
            px: 2.25,
            py: 1.75,
            background: isDark
              ? `linear-gradient(135deg,
                  ${alpha(theme.palette.primary.main, 0.07)},
                  ${alpha(theme.palette.background.paper, 0)})`
              : `linear-gradient(135deg,
                  ${alpha(theme.palette.primary.main, 0.04)},
                  ${alpha(theme.palette.warning.main, 0.03)})`
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            {/* 좌: 타이틀 + 세그먼트 탭 */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Stack spacing={0.2}>
                <Typography variant="h5" fontWeight={900} letterSpacing="-0.03em" lineHeight={1.2}>
                  라이브러리
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  완료된 항목만 모아 봅니다.
                </Typography>
              </Stack>

              {/* 수직 구분선 */}
              <Box
                sx={{
                  width: '1px',
                  height: 28,
                  bgcolor: isDark
                    ? alpha(theme.palette.common.white, 0.1)
                    : alpha(theme.palette.common.black, 0.1)
                }}
              />

              <SegmentedControl
                value={tab}
                onChange={setTab}
                videoCnt={videoItems.length}
                audioCnt={audioItems.length}
              />
            </Stack>

            {/* 우: 액션 버튼 */}
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
              <IconButton
                size="small"
                disabled={loading || refreshing}
                onClick={() => void loadItems('refresh')}
                title="새로고침"
                sx={{
                  width: 30,
                  height: 30,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.25,
                  color: refreshing ? 'primary.main' : 'text.secondary'
                }}
              >
                {refreshing ? (
                  <CircularProgress size={13} color="inherit" />
                ) : (
                  <RefreshRoundedIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FolderOpenRoundedIcon sx={{ fontSize: 15 }} />}
                onClick={() => void handleOpenDownloadsFolder()}
                sx={{
                  fontSize: '0.75rem',
                  height: 30,
                  px: 1.5,
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary', borderColor: 'text.secondary' }
                }}
              >
                폴더 열기
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* ── 리스트 패널 ───────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: isDark
              ? alpha(theme.palette.common.white, 0.08)
              : alpha(theme.palette.common.black, 0.1),
            overflow: 'hidden'
          }}
        >
          {loading ? (
            <Box sx={{ py: 8 }}>
              <Stack alignItems="center" spacing={1.5}>
                <CircularProgress size={26} />
                <Typography variant="body2" color="text.secondary">
                  불러오는 중…
                </Typography>
              </Stack>
            </Box>
          ) : visibleItems.length === 0 ? (
            <Box sx={{ py: 9 }}>
              <Stack alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 3,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha(
                      tab === 'video' ? theme.palette.primary.main : theme.palette.warning.main,
                      isDark ? 0.12 : 0.07
                    )
                  }}
                >
                  {tab === 'video' ? (
                    <MovieRoundedIcon sx={{ fontSize: 30, color: 'primary.main', opacity: 0.6 }} />
                  ) : (
                    <AudioFileRoundedIcon
                      sx={{ fontSize: 30, color: 'warning.main', opacity: 0.6 }}
                    />
                  )}
                </Box>
                <Stack alignItems="center" spacing={0.4}>
                  <Typography fontWeight={700} fontSize="0.9rem">
                    {tab === 'video' ? '아직 비디오가 없습니다' : '아직 오디오가 없습니다'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    다운로드가 완료되면 여기에 표시됩니다.
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          ) : (
            <Stack
              divider={
                <Divider
                  sx={{
                    borderColor: isDark
                      ? alpha(theme.palette.common.white, 0.05)
                      : alpha(theme.palette.common.black, 0.06)
                  }}
                />
              }
            >
              {visibleItems.map((item) => {
                const isVideo = item.type === 'video'
                const thumbnailUrl = toMediaUrl(item.thumbnailPath)
                const hasThumbnail = Boolean(thumbnailUrl)
                const isDeleting = deletingId === item.id

                return (
                  <Box
                    key={item.id}
                    onClick={isVideo && !isDeleting ? () => void handleOpenPlayer(item) : undefined}
                    sx={{
                      cursor: isVideo && !isDeleting ? 'pointer' : 'default',
                      opacity: isDeleting ? 0.4 : 1,
                      transition: 'opacity 180ms ease, background-color 120ms ease',
                      '&:hover':
                        isVideo && !isDeleting
                          ? {
                              bgcolor: isDark
                                ? alpha(theme.palette.primary.main, 0.06)
                                : alpha(theme.palette.primary.main, 0.025)
                            }
                          : undefined
                    }}
                  >
                    <Stack direction="row" sx={{ minHeight: 92 }}>
                      {/* 썸네일 */}
                      <Box sx={{ width: 152, flexShrink: 0, p: 1.25, pr: 0 }}>
                        <Box
                          sx={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '16 / 9',
                            borderRadius: 1.25,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: isDark
                              ? alpha(theme.palette.common.white, 0.07)
                              : alpha(theme.palette.common.black, 0.1)
                          }}
                        >
                          {hasThumbnail ? (
                            <Thumbnail
                              url={thumbnailUrl}
                              w="100%"
                              h="100%"
                              alt={item.title ?? item.fileName}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: '100%',
                                height: '100%',
                                display: 'grid',
                                placeItems: 'center',
                                background: `linear-gradient(135deg,
                                  ${alpha(isVideo ? theme.palette.primary.main : theme.palette.warning.main, 0.15)},
                                  ${alpha(theme.palette.primary.main, 0.05)})`
                              }}
                            >
                              {isVideo ? (
                                <MovieRoundedIcon
                                  sx={{ fontSize: 24, color: 'primary.main', opacity: 0.45 }}
                                />
                              ) : (
                                <AudioFileRoundedIcon
                                  sx={{ fontSize: 24, color: 'warning.main', opacity: 0.45 }}
                                />
                              )}
                            </Box>
                          )}

                          {/* 재생 오버레이 */}
                          {isVideo && (
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'transparent',
                                opacity: 0,
                                transition: 'opacity 130ms ease, background-color 130ms ease',
                                '*:hover > * > * > * > &': {
                                  opacity: 1,
                                  bgcolor: alpha(theme.palette.common.black, 0.4)
                                }
                              }}
                            >
                              <PlayCircleOutlineRoundedIcon
                                sx={{ fontSize: 26, color: 'common.white' }}
                              />
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* 콘텐츠 */}
                      <Stack
                        sx={{ minWidth: 0, flex: 1, px: 2, py: 1.5 }}
                        justifyContent="space-between"
                      >
                        {/* 상단: 타이틀 + 업로더 + 메뉴 */}
                        <Stack
                          direction="row"
                          alignItems="flex-start"
                          justifyContent="space-between"
                          spacing={1.5}
                        >
                          <Stack spacing={0.3} sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              fontWeight={700}
                              sx={{ fontSize: '0.88rem', lineHeight: 1.4 }}
                              noWrap
                              title={item.title ?? item.fileName}
                            >
                              {item.title ?? item.fileName}
                            </Typography>
                            <Typography
                              variant="caption"
                              noWrap
                              title={item.uploader ?? undefined}
                              sx={{
                                color: isDark
                                  ? alpha(theme.palette.common.white, 0.4)
                                  : theme.palette.text.secondary,
                                fontSize: '0.72rem'
                              }}
                            >
                              {item.uploader ?? '업로더 정보 없음'}
                            </Typography>
                          </Stack>

                          <IconButton
                            size="small"
                            disabled={isDeleting}
                            onClick={(e) => {
                              e.stopPropagation()
                              setMenuState({ phase: 'open', anchorEl: e.currentTarget, item })
                            }}
                            sx={{
                              mt: -0.25,
                              flexShrink: 0,
                              width: 26,
                              height: 26,
                              color: isDark
                                ? alpha(theme.palette.common.white, 0.35)
                                : theme.palette.text.secondary,
                              '&:hover': { color: 'text.primary' }
                            }}
                          >
                            {isDeleting ? (
                              <CircularProgress size={12} />
                            ) : (
                              <MoreHorizRoundedIcon sx={{ fontSize: 16 }} />
                            )}
                          </IconButton>
                        </Stack>

                        {/* 하단: 메타 정보 */}
                        <Stack
                          direction="row"
                          spacing={0.6}
                          useFlexGap
                          flexWrap="wrap"
                          alignItems="center"
                        >
                          <Typography
                            sx={{
                              fontSize: '0.68rem',
                              color: isDark
                                ? alpha(theme.palette.common.white, 0.28)
                                : theme.palette.text.disabled
                            }}
                          >
                            {formatDate(item)}
                          </Typography>

                          <Box
                            component="span"
                            sx={{
                              width: '3px',
                              height: '3px',
                              borderRadius: '50%',
                              flexShrink: 0,
                              bgcolor: isDark
                                ? alpha(theme.palette.common.white, 0.15)
                                : alpha(theme.palette.common.black, 0.2)
                            }}
                          />

                          <Chip
                            size="small"
                            variant="outlined"
                            label={formatFileSize(item.fileSize)}
                            sx={{
                              height: 18,
                              fontSize: '0.66rem',
                              borderRadius: 0.75,
                              borderColor: isDark
                                ? alpha(theme.palette.common.white, 0.1)
                                : alpha(theme.palette.common.black, 0.13),
                              color: isDark
                                ? alpha(theme.palette.common.white, 0.45)
                                : theme.palette.text.secondary
                            }}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`.${item.extension}`}
                            sx={{
                              height: 18,
                              fontSize: '0.66rem',
                              borderRadius: 0.75,
                              borderColor: isDark
                                ? alpha(theme.palette.common.white, 0.1)
                                : alpha(theme.palette.common.black, 0.13),
                              color: isDark
                                ? alpha(theme.palette.common.white, 0.45)
                                : theme.palette.text.secondary
                            }}
                          />

                          {!isVideo && (
                            <Chip
                              size="small"
                              label="재생 미지원"
                              sx={{
                                height: 18,
                                fontSize: '0.66rem',
                                borderRadius: 0.75,
                                bgcolor: alpha(theme.palette.warning.main, isDark ? 0.12 : 0.08),
                                color: isDark
                                  ? theme.palette.warning.light
                                  : theme.palette.warning.dark,
                                border: 'none'
                              }}
                            />
                          )}
                        </Stack>
                      </Stack>
                    </Stack>
                  </Box>
                )
              })}
            </Stack>
          )}
        </Paper>
      </Stack>

      {/* 컨텍스트 메뉴 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={closeMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: { sx: { minWidth: 164, borderRadius: 1.5 } }
        }}
      >
        <MenuItem
          dense
          onClick={() => {
            const cur = menuItem
            closeMenu()
            if (cur) void handleOpenFileLocation(cur)
          }}
        >
          <FolderOpenRoundedIcon sx={{ mr: 1.25, fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">파일 위치 열기</Typography>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        {menuState.phase !== 'confirmDelete' ? (
          <MenuItem
            dense
            sx={{ color: 'error.main' }}
            onClick={() => {
              if (menuState.phase === 'open') {
                setMenuState({
                  phase: 'confirmDelete',
                  anchorEl: menuState.anchorEl,
                  item: menuState.item
                })
              }
            }}
          >
            <DeleteOutlineRoundedIcon sx={{ mr: 1.25, fontSize: 16 }} />
            <Typography variant="body2" color="error">
              삭제
            </Typography>
          </MenuItem>
        ) : (
          <Box sx={{ px: 1.5, pt: 0.5, pb: 1.25 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              정말 삭제할까요?
            </Typography>
            <Stack direction="row" spacing={0.75}>
              <Button
                size="small"
                variant="contained"
                color="error"
                disableElevation
                fullWidth
                sx={{ fontSize: '0.72rem', py: 0.5 }}
                onClick={() => {
                  const cur = menuItem
                  if (cur) void handleDelete(cur)
                }}
              >
                삭제
              </Button>
              <Button
                size="small"
                variant="outlined"
                fullWidth
                sx={{ fontSize: '0.72rem', py: 0.5 }}
                onClick={closeMenu}
              >
                취소
              </Button>
            </Stack>
          </Box>
        )}
      </Menu>
    </Box>
  )
}
