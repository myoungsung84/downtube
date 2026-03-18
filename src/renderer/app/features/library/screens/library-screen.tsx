import 'dayjs/locale/ko'

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
import { useDialog } from '@renderer/shared/hooks/use-dialog'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import { useToast } from '@renderer/shared/hooks/use-toast'
import { toMediaUrl } from '@renderer/shared/lib/media-url'
import type { LibraryItem, LibraryItemType } from '@src/types/library.types'
import dayjs from 'dayjs'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

// ─── helpers ──────────────────────────────────────────────────────────────────

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

function formatDate(item: LibraryItem, language: 'ko' | 'en'): string {
  const downloadedAt = item.downloadedAt ? dayjs(item.downloadedAt) : null
  const timestamp = downloadedAt?.isValid() ? downloadedAt : dayjs(item.createdAt)
  return timestamp.locale(language).format('YYYY. MM. DD. A hh:mm')
}

// ─── types ────────────────────────────────────────────────────────────────────

type MenuState = { phase: 'idle' } | { phase: 'open'; anchorEl: HTMLElement; item: LibraryItem }
const PLAYABLE_ITEM_TYPES: readonly LibraryItemType[] = ['video', 'audio']

// ─── SegmentedControl ─────────────────────────────────────────────────────────

interface SegmentedControlProps {
  value: LibraryItemType
  onChange: (value: LibraryItemType) => void
  videoCnt: number
  audioCnt: number
  videoLabel: string
  audioLabel: string
}

function SegmentedControl({
  value,
  onChange,
  videoCnt,
  audioCnt,
  videoLabel,
  audioLabel
}: SegmentedControlProps): React.JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const segments: { key: LibraryItemType; label: string; count: number }[] = [
    { key: 'video', label: videoLabel, count: videoCnt },
    { key: 'audio', label: audioLabel, count: audioCnt }
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
  const { t, language } = useI18n('library')
  const { showToast } = useToast()
  const { confirm } = useDialog()
  const isDark = theme.palette.mode === 'dark'

  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<LibraryItemType>('video')
  const [menuState, setMenuState] = useState<MenuState>({ phase: 'idle' })
  const [pendingDeleteItem, setPendingDeleteItem] = useState<LibraryItem | null>(null)
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
        showToast(t('toast.load_failed'), 'error')
      } finally {
        if (mode === 'refresh') setRefreshing(false)
        else setLoading(false)
      }
    },
    [showToast, t]
  )

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const handleOpenDownloadsFolder = async (): Promise<void> => {
    try {
      const result = await window.api.openDownloadDir()
      if (result && 'success' in result && !result.success) {
        showToast(result.message ?? t('toast.open_downloads_folder_failed'), 'error')
      }
    } catch {
      showToast(t('toast.open_downloads_folder_failed'), 'error')
    }
  }

  const handleOpenFileLocation = async (item: LibraryItem): Promise<void> => {
    const result = await window.api.openDownloadItem(item.filePath)
    if (!result.success) showToast(result.message ?? t('toast.open_file_location_failed'), 'error')
  }

  const closeMenu = useCallback((): void => {
    setMenuState({ phase: 'idle' })
  }, [])

  const blurActiveElement = useCallback((): void => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }, [])

  const handleDelete = async (item: LibraryItem): Promise<void> => {
    const ok = await confirm({
      title: t('dialog.delete.title'),
      message: t('dialog.delete.message', { itemTitle: item.title ?? item.fileName }),
      confirmText: t('dialog.delete.confirm'),
      cancelText: t('actions.cancel'),
      variant: 'danger'
    })

    if (!ok) return

    setDeletingId(item.id)

    try {
      const result = await window.api.deleteLibraryItem(item.filePath)
      if (!result.success) {
        showToast(result.message ?? t('toast.delete_failed'), 'error')
        return
      }

      setItems((prev) => prev.filter((currentItem) => currentItem.filePath !== item.filePath))
      showToast(t('toast.deleted'), 'success')
    } catch {
      showToast(t('toast.delete_failed'), 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRequestDelete = useCallback(
    (item: LibraryItem): void => {
      blurActiveElement()
      setPendingDeleteItem(item)
      closeMenu()
    },
    [blurActiveElement, closeMenu]
  )

  const handleOpenPlayer = async (item: LibraryItem): Promise<void> => {
    const result = await window.api.openPlayerFile(item.filePath)
    if (!result.success) showToast(result.message ?? t('toast.open_player_failed'), 'error')
  }

  const isMenuOpen = menuState.phase === 'open'
  const menuAnchorEl = isMenuOpen ? menuState.anchorEl : null
  const menuItem = isMenuOpen ? menuState.item : null

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack sx={{ width: '100%', maxWidth: 1400, p: 3 }} spacing={1.75}>
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
            <Stack direction="row" alignItems="center" spacing={2}>
              <Stack spacing={0.2}>
                <Typography variant="h5" fontWeight={900} letterSpacing="-0.03em" lineHeight={1.2}>
                  {t('header.title')}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {t('header.description')}
                </Typography>
              </Stack>

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
                videoLabel={t('tabs.video')}
                audioLabel={t('tabs.audio')}
              />
            </Stack>

            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
              <IconButton
                size="small"
                disabled={loading || refreshing}
                onClick={() => void loadItems('refresh')}
                title={t('actions.refresh')}
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
                {t('actions.open_folder')}
              </Button>
            </Stack>
          </Stack>
        </Paper>

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
                  {t('loading')}
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
                    {tab === 'video' ? t('empty.video_title') : t('empty.audio_title')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('empty.description')}
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
                const canOpenPlayer = PLAYABLE_ITEM_TYPES.includes(item.type) && !isDeleting

                return (
                  <Box
                    key={item.id}
                    onClick={canOpenPlayer ? () => void handleOpenPlayer(item) : undefined}
                    sx={{
                      cursor: canOpenPlayer ? 'pointer' : 'default',
                      opacity: isDeleting ? 0.4 : 1,
                      transition: 'opacity 180ms ease, background-color 120ms ease',
                      '&:hover': canOpenPlayer
                        ? {
                            bgcolor: isDark
                              ? alpha(theme.palette.primary.main, 0.06)
                              : alpha(theme.palette.primary.main, 0.025)
                          }
                        : undefined
                    }}
                  >
                    <Stack direction="row" sx={{ minHeight: 92 }}>
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

                          {canOpenPlayer && (
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

                      <Stack
                        sx={{ minWidth: 0, flex: 1, px: 2, py: 1.5 }}
                        justifyContent="space-between"
                      >
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
                              {item.uploader ?? t('item.uploader_fallback')}
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
                            {formatDate(item, language)}
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

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={closeMenu}
        disableRestoreFocus
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        TransitionProps={{
          onExited: () => {
            if (!pendingDeleteItem) return

            const item = pendingDeleteItem
            setPendingDeleteItem(null)
            void handleDelete(item)
          }
        }}
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
          <Typography variant="body2">{t('menu.open_file_location')}</Typography>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          dense
          sx={{ color: 'error.main' }}
          onClick={() => {
            const cur = menuItem
            if (cur) handleRequestDelete(cur)
          }}
        >
          <DeleteOutlineRoundedIcon sx={{ mr: 1.25, fontSize: 16 }} />
          <Typography variant="body2" color="error">
            {t('menu.delete')}
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  )
}
