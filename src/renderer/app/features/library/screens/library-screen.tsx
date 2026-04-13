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
  Fade,
  FormControl,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  Typography,
  useTheme
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useSettingsStore } from '@renderer/features/settings/store/use-settings-store'
import Thumbnail from '@renderer/shared/components/ui/thumbnail'
import { useDialog } from '@renderer/shared/hooks/use-dialog'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import { useToast } from '@renderer/shared/hooks/use-toast'
import { resolveAppErrorMessage } from '@renderer/shared/lib/app-error'
import { toMediaUrl } from '@renderer/shared/lib/media-url'
import {
  DEFAULT_LIBRARY_SORT_KEY,
  isLibrarySortKey,
  type LibraryItem,
  type LibraryItemType,
  type LibrarySortKey
} from '@src/types/library.types'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  buildLibraryPlayerQueuePaths,
  formatLibraryFileSize,
  formatLibraryItemDate,
  getLibraryItemDisplayTitle
} from '../lib/library-screen-helpers'
import { LIBRARY_SORT_OPTIONS, sortLibraryItems } from '../lib/library-sort'
import type { LibraryMenuState, LibraryPlayerOpenState } from '../types/library-screen.types'

const PLAYABLE_ITEM_TYPES: readonly LibraryItemType[] = ['video', 'audio']
const LIBRARY_SORT_KEY = 'library.sortKey' as const

const META_CHIP_SX = {
  height: 18,
  fontSize: '0.66rem',
  borderRadius: 0.75,
  borderColor: 'divider',
  color: 'text.secondary'
} as const

function SegmentedControl({
  value,
  onChange,
  videoCnt,
  audioCnt,
  videoLabel,
  audioLabel
}: {
  value: LibraryItemType
  onChange: (value: LibraryItemType) => void
  videoCnt: number
  audioCnt: number
  videoLabel: string
  audioLabel: string
}): React.JSX.Element {
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

function LibraryHeaderSection({
  title,
  description,
  tab,
  onTabChange,
  videoCount,
  audioCount,
  videoLabel,
  audioLabel,
  sortKey,
  sortOptions,
  onSortChange,
  sortLabel,
  loading,
  refreshing,
  onRefresh,
  openFolderLabel,
  refreshLabel,
  onOpenDownloadsFolder
}: {
  title: string
  description: string
  tab: LibraryItemType
  onTabChange: (value: LibraryItemType) => void
  videoCount: number
  audioCount: number
  videoLabel: string
  audioLabel: string
  sortKey: LibrarySortKey
  sortOptions: ReadonlyArray<{ key: LibrarySortKey; label: string }>
  onSortChange: (event: SelectChangeEvent<LibrarySortKey>) => void
  sortLabel: string
  loading: boolean
  refreshing: boolean
  onRefresh: () => void
  openFolderLabel: string
  refreshLabel: string
  onOpenDownloadsFolder: () => void
}): React.JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        p: 1.5
      }}
    >
      <Stack spacing={1.5}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.03em" lineHeight={1.2}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {description}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
          <SegmentedControl
            value={tab}
            onChange={onTabChange}
            videoCnt={videoCount}
            audioCnt={audioCount}
            videoLabel={videoLabel}
            audioLabel={audioLabel}
          />
          <Stack direction="row" alignItems="center" spacing={1}>
            <FormControl size="small">
              <Select
                value={sortKey}
                onChange={onSortChange}
                inputProps={{ 'aria-label': sortLabel }}
                sx={{
                  height: 32,
                  minWidth: 148,
                  borderRadius: 1.25,
                  color: 'text.secondary',
                  fontSize: '0.78rem',
                  bgcolor: alpha(theme.palette.common.black, isDark ? 0.12 : 0.03),
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                  '& .MuiSelect-select': { py: 0.75, pr: 4.5 }
                }}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.key} value={option.key}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              size="small"
              disabled={loading || refreshing}
              onClick={onRefresh}
              title={refreshLabel}
              sx={{
                width: 32,
                height: 32,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.25,
                color: refreshing ? 'primary.main' : 'text.secondary',
                flexShrink: 0
              }}
            >
              {refreshing ? (
                <CircularProgress size={13} color="inherit" />
              ) : (
                <RefreshRoundedIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
            <Divider orientation="vertical" flexItem sx={{ height: 20, alignSelf: 'center' }} />
            <Button
              variant="text"
              size="small"
              startIcon={<FolderOpenRoundedIcon sx={{ fontSize: 15 }} />}
              onClick={onOpenDownloadsFolder}
              sx={{
                height: 32,
                borderRadius: 1.25,
                px: 1.25,
                flexShrink: 0,
                color: 'text.secondary',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                '&:hover': {
                  color: 'text.primary',
                  bgcolor: alpha(theme.palette.common.white, isDark ? 0.06 : 0)
                }
              }}
            >
              {openFolderLabel}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  )
}

function LibraryEmptyState({
  tab,
  videoTitle,
  audioTitle,
  description
}: {
  tab: LibraryItemType
  videoTitle: string
  audioTitle: string
  description: string
}): React.JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Fade in timeout={400}>
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
              <AudioFileRoundedIcon sx={{ fontSize: 30, color: 'warning.main', opacity: 0.6 }} />
            )}
          </Box>
          <Stack alignItems="center" spacing={0.4}>
            <Typography fontWeight={700} fontSize="0.9rem">
              {tab === 'video' ? videoTitle : audioTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Fade>
  )
}

function LibraryItemRow({
  item,
  isDeleting,
  language,
  uploaderFallback,
  onOpenPlayer,
  onOpenMenu
}: {
  item: LibraryItem
  isDeleting: boolean
  language: 'ko' | 'en'
  uploaderFallback: string
  onOpenPlayer: (item: LibraryItem) => void
  onOpenMenu: (anchorEl: HTMLElement, item: LibraryItem) => void
}): React.JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const isVideo = item.type === 'video'
  const thumbnailUrl = toMediaUrl(item.thumbnailPath)
  const hasThumbnail = Boolean(thumbnailUrl)
  const canOpenPlayer = PLAYABLE_ITEM_TYPES.includes(item.type) && !isDeleting
  const title = getLibraryItemDisplayTitle(item)

  return (
    <Box
      onClick={
        canOpenPlayer
          ? () => {
              void onOpenPlayer(item)
            }
          : undefined
      }
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
              borderColor: 'divider'
            }}
          >
            {hasThumbnail ? (
              <Thumbnail
                url={thumbnailUrl}
                w="100%"
                h="100%"
                alt={title}
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
                  <MovieRoundedIcon sx={{ fontSize: 24, color: 'primary.main', opacity: 0.45 }} />
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
                <PlayCircleOutlineRoundedIcon sx={{ fontSize: 26, color: 'common.white' }} />
              </Box>
            )}
          </Box>
        </Box>

        <Stack sx={{ minWidth: 0, flex: 1, px: 2, py: 1.5 }} justifyContent="space-between">
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={1.5}
          >
            <Stack spacing={0.3} sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                fontWeight={700}
                sx={{ fontSize: '0.9rem', lineHeight: 1.4 }}
                noWrap
                title={title}
              >
                {title}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                title={item.uploader ?? undefined}
                sx={{ color: 'text.secondary', fontSize: '0.72rem' }}
              >
                {item.uploader ?? uploaderFallback}
              </Typography>
            </Stack>

            <IconButton
              size="small"
              disabled={isDeleting}
              onClick={(event) => {
                event.stopPropagation()
                onOpenMenu(event.currentTarget, item)
              }}
              sx={{
                mt: -0.25,
                flexShrink: 0,
                width: 26,
                height: 26,
                color: 'text.secondary',
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

          <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap" alignItems="center">
            <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>
              {formatLibraryItemDate(item, language)}
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
              label={formatLibraryFileSize(item.fileSize)}
              sx={META_CHIP_SX}
            />
            <Chip size="small" variant="outlined" label={`.${item.extension}`} sx={META_CHIP_SX} />
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

function LibraryItemListSection({
  items,
  deletingId,
  language,
  uploaderFallback,
  onOpenPlayer,
  onOpenMenu
}: {
  items: readonly LibraryItem[]
  deletingId: string | null
  language: 'ko' | 'en'
  uploaderFallback: string
  onOpenPlayer: (item: LibraryItem) => void
  onOpenMenu: (anchorEl: HTMLElement, item: LibraryItem) => void
}): React.JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
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
      {items.map((item) => (
        <LibraryItemRow
          key={item.id}
          item={item}
          isDeleting={deletingId === item.id}
          language={language}
          uploaderFallback={uploaderFallback}
          onOpenPlayer={onOpenPlayer}
          onOpenMenu={onOpenMenu}
        />
      ))}
    </Stack>
  )
}

export default function LibraryScreen(): React.JSX.Element {
  const { t, language } = useI18n('library')
  const { showToast } = useToast()
  const { confirm } = useDialog()
  const hydrateSetting = useSettingsStore((state) => state.hydrateSetting)
  const setSettingValue = useSettingsStore((state) => state.setValue)

  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<LibraryItemType>('video')
  const [sortKey, setSortKey] = useState<LibrarySortKey>(DEFAULT_LIBRARY_SORT_KEY)
  const [menuState, setMenuState] = useState<LibraryMenuState>({ phase: 'idle' })
  const [pendingDeleteItem, setPendingDeleteItem] = useState<LibraryItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const playerOpenInFlightRef = useRef(false)
  const lastPlayerOpenRef = useRef<LibraryPlayerOpenState | null>(null)
  const lastMenuTriggerRef = useRef<HTMLElement | null>(null)
  const pendingDeleteFrameRef = useRef<number | null>(null)

  const videoItems = useMemo(() => items.filter((i) => i.type === 'video'), [items])
  const audioItems = useMemo(() => items.filter((i) => i.type === 'audio'), [items])
  const visibleItems = tab === 'video' ? videoItems : audioItems
  const sortedVisibleItems = useMemo(
    () => sortLibraryItems(visibleItems, sortKey),
    [sortKey, visibleItems]
  )

  const loadItems = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial'): Promise<void> => {
      if (mode === 'refresh') setRefreshing(true)
      else setLoading(true)
      try {
        const result = await window.api.listLibraryItems()
        if (!result.success) {
          showToast(resolveAppErrorMessage(result.error, 'library:toast.load_failed'), 'error')
          setItems([])
          return
        }

        setItems(result.items)
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

  useEffect(() => {
    let cancelled = false

    void hydrateSetting(LIBRARY_SORT_KEY)
      .then((savedSortKey) => {
        if (cancelled) return
        setSortKey(isLibrarySortKey(savedSortKey) ? savedSortKey : DEFAULT_LIBRARY_SORT_KEY)
      })
      .catch(() => {
        if (cancelled) return
        setSortKey(DEFAULT_LIBRARY_SORT_KEY)
      })

    return () => {
      cancelled = true
    }
  }, [hydrateSetting])

  useEffect(() => {
    return () => {
      if (pendingDeleteFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingDeleteFrameRef.current)
      }
    }
  }, [])

  const handleOpenDownloadsFolder = async (): Promise<void> => {
    try {
      const result = await window.api.openDownloadDir()
      if (result && 'success' in result && !result.success) {
        showToast(
          resolveAppErrorMessage(result.error, 'library:toast.open_downloads_folder_failed'),
          'error'
        )
      }
    } catch {
      showToast(t('toast.open_downloads_folder_failed'), 'error')
    }
  }

  const handleOpenFileLocation = async (item: LibraryItem): Promise<void> => {
    const result = await window.api.openDownloadItem(item.filePath)
    if (!result.success) {
      showToast(
        resolveAppErrorMessage(result.error, 'library:toast.open_file_location_failed'),
        'error'
      )
    }
  }

  const blurActiveElement = useCallback((): void => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }, [])

  const closeMenu = useCallback((): void => {
    blurActiveElement()
    setMenuState({ phase: 'idle' })
  }, [blurActiveElement])

  const handleDelete = async (item: LibraryItem): Promise<void> => {
    const ok = await confirm({
      title: t('dialog.delete.title'),
      message: t('dialog.delete.message', { itemTitle: getLibraryItemDisplayTitle(item) }),
      confirmText: t('dialog.delete.confirm'),
      cancelText: t('actions.cancel'),
      variant: 'danger'
    })

    if (!ok) return

    setDeletingId(item.id)

    try {
      const result = await window.api.deleteLibraryItem(item.filePath)
      if (!result.success) {
        showToast(resolveAppErrorMessage(result.error, 'library:toast.delete_failed'), 'error')
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
      setPendingDeleteItem(item)
      closeMenu()
    },
    [closeMenu]
  )

  const handleOpenPlayer = async (item: LibraryItem): Promise<void> => {
    const now = Date.now()
    const lastOpen = lastPlayerOpenRef.current

    if (lastOpen && lastOpen.itemId === item.id && now - lastOpen.at < 400) {
      return
    }

    if (playerOpenInFlightRef.current) return

    const queuePaths = buildLibraryPlayerQueuePaths(sortedVisibleItems, item.filePath)

    lastPlayerOpenRef.current = { itemId: item.id, at: now }
    playerOpenInFlightRef.current = true

    try {
      const result = await window.api.openPlayer({ paths: queuePaths })
      if (!result.success) {
        showToast(resolveAppErrorMessage(result.error, 'library:toast.open_player_failed'), 'error')
      }
    } finally {
      playerOpenInFlightRef.current = false
    }
  }

  const isMenuOpen = menuState.phase === 'open'
  const menuAnchorEl = isMenuOpen ? menuState.anchorEl : null
  const menuItem = isMenuOpen ? menuState.item : null

  const handleSortChange = useCallback(
    (event: SelectChangeEvent<LibrarySortKey>): void => {
      const nextSortKey = isLibrarySortKey(event.target.value)
        ? event.target.value
        : DEFAULT_LIBRARY_SORT_KEY

      setSortKey(nextSortKey)
      void setSettingValue(LIBRARY_SORT_KEY, nextSortKey).catch(() => undefined)
    },
    [setSettingValue]
  )

  const handleOpenMenu = useCallback((anchorEl: HTMLElement, item: LibraryItem): void => {
    lastMenuTriggerRef.current = anchorEl
    setMenuState({ phase: 'open', anchorEl, item })
  }, [])

  const sortOptions = useMemo(
    () => LIBRARY_SORT_OPTIONS.map((option) => ({ key: option.key, label: t(option.labelKey) })),
    [t]
  )

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack sx={{ width: '100%', maxWidth: 1400, px: 3, py: 3 }} spacing={2}>
        <LibraryHeaderSection
          title={t('header.title')}
          description={t('header.description')}
          tab={tab}
          onTabChange={setTab}
          videoCount={videoItems.length}
          audioCount={audioItems.length}
          videoLabel={t('tabs.video')}
          audioLabel={t('tabs.audio')}
          sortKey={sortKey}
          sortOptions={sortOptions}
          onSortChange={handleSortChange}
          sortLabel={t('sort.label')}
          loading={loading}
          refreshing={refreshing}
          onRefresh={() => void loadItems('refresh')}
          openFolderLabel={t('actions.open_folder')}
          refreshLabel={t('actions.refresh')}
          onOpenDownloadsFolder={() => void handleOpenDownloadsFolder()}
        />

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
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
          ) : sortedVisibleItems.length === 0 ? (
            <LibraryEmptyState
              tab={tab}
              videoTitle={t('empty.video_title')}
              audioTitle={t('empty.audio_title')}
              description={t('empty.description')}
            />
          ) : (
            <LibraryItemListSection
              items={sortedVisibleItems}
              deletingId={deletingId}
              language={language}
              uploaderFallback={t('item.uploader_fallback')}
              onOpenPlayer={handleOpenPlayer}
              onOpenMenu={handleOpenMenu}
            />
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
            if (!pendingDeleteItem) {
              if (lastMenuTriggerRef.current?.isConnected) {
                lastMenuTriggerRef.current.focus()
              }
              return
            }

            const item = pendingDeleteItem
            setPendingDeleteItem(null)
            pendingDeleteFrameRef.current = window.requestAnimationFrame(() => {
              pendingDeleteFrameRef.current = null
              void handleDelete(item)
            })
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
