import CloseIcon from '@mui/icons-material/Close'
import HistoryIcon from '@mui/icons-material/History'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import {
  Alert,
  alpha,
  Autocomplete,
  Box,
  Button,
  Divider,
  Fade,
  IconButton,
  InputAdornment,
  Paper,
  PaperProps,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import type { RecentUrlHistoryItem } from '@src/types/settings.types'
import React from 'react'

const HISTORY_KIND_KEY = {
  playlist: 'history.kind.playlist',
  single: 'history.kind.video'
} as const satisfies Record<RecentUrlHistoryItem['kind'], string>

function getRecentItemDisplayTitle(
  item: RecentUrlHistoryItem,
  t: ReturnType<typeof useI18n>['t']
): string {
  return item.title || t(HISTORY_KIND_KEY[item.kind])
}

export default function DownloadsUrlPanel(props: {
  inputRef: React.RefObject<HTMLInputElement | null>
  inputValue: string
  recentUrls: RecentUrlHistoryItem[]
  submitting: null | { url: string; kind: 'playlist' | 'single' }
  onChangeInputValue: (value: string) => void
  onClearRecentUrls: () => void
  onRemoveRecentUrl: (url: string) => void
  onSelectRecentUrl: (item: RecentUrlHistoryItem) => void
  onSubmit: () => void
}): React.JSX.Element {
  const { t } = useI18n('downloads')
  const {
    inputRef,
    inputValue,
    recentUrls,
    submitting,
    onChangeInputValue,
    onClearRecentUrls,
    onRemoveRecentUrl,
    onSelectRecentUrl,
    onSubmit
  } = props

  const PaperWithHeader = React.useCallback(
    ({ children, ...paperProps }: PaperProps) => {
      const extraSx = Array.isArray(paperProps.sx)
        ? paperProps.sx
        : paperProps.sx
          ? [paperProps.sx]
          : []
      return (
        <Paper
          {...paperProps}
          sx={[
            {
              mt: 0.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 8px 24px rgba(0,0,0,0.09)',
              overflow: 'hidden'
            },
            ...extraSx
          ]}
        >
          {recentUrls.length > 0 && (
            <>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 1.5, pt: 1.25, pb: 0.75 }}
              >
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <HistoryIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    {t('form.recent.title')}
                  </Typography>
                </Stack>
                <Button
                  size="small"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onClearRecentUrls()
                  }}
                  sx={{
                    minWidth: 0,
                    px: 0.75,
                    py: 0.25,
                    fontSize: '0.72rem',
                    color: 'text.disabled',
                    '&:hover': { color: 'error.main' }
                  }}
                >
                  {t('form.recent.clear_all')}
                </Button>
              </Stack>
              <Divider />
            </>
          )}
          {children}
        </Paper>
      )
    },
    [onClearRecentUrls, recentUrls.length, t]
  )

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(
                theme.palette.info.main,
                0.012
              )} 100%)`
            : theme.palette.background.paper
      }}
    >
      <Stack spacing={2}>
        <Typography variant="body2" fontWeight={700} color="text.secondary">
          {t('form.title')}
        </Typography>

        <Autocomplete
          autoHighlight
          freeSolo
          fullWidth
          disableClearable
          filterOptions={(options, state) => {
            const keyword = state.inputValue.trim().toLowerCase()
            if (!keyword) return options

            return options.filter((option) => {
              const displayTitle = getRecentItemDisplayTitle(option, t)
              return (
                displayTitle.toLowerCase().includes(keyword) ||
                option.url.toLowerCase().includes(keyword)
              )
            })
          }}
          options={recentUrls}
          inputValue={inputValue}
          disabled={submitting !== null}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.url)}
          onInputChange={(_, value) => onChangeInputValue(value)}
          onChange={(_, value) => {
            if (!value || typeof value === 'string') return
            onSelectRecentUrl(value)
          }}
          PaperComponent={PaperWithHeader}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={inputRef}
              placeholder={t('form.placeholder')}
              variant="outlined"
              onKeyDown={(e): void => {
                if (e.key === 'Enter') onSubmit()
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.85rem',
                  pr: 0.75,
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'light'
                      ? alpha(theme.palette.background.default, 0.7)
                      : theme.palette.background.paper,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '1px'
                  }
                }
              }}
              slotProps={{
                input: {
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <VideoLibraryIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      <InputAdornment position="end">
                        <Button
                          variant="contained"
                          onClick={onSubmit}
                          disabled={submitting !== null}
                          disableElevation
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            px: 2.5,
                            py: 1,
                            borderRadius: 1.5,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {submitting ? t('form.actions.processing') : t('form.actions.add')}
                        </Button>
                      </InputAdornment>
                      {params.InputProps.endAdornment}
                    </>
                  )
                }
              }}
            />
          )}
          renderOption={(optionProps, option) => {
            return (
              <li {...optionProps} key={option.url} style={{ padding: 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    px: 1.5,
                    py: 0.875,
                    gap: 1,
                    cursor: 'pointer'
                  }}
                >
                  <HistoryIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.25
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        color: 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {getRecentItemDisplayTitle(option, t)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {t(
                        option.kind === 'playlist'
                          ? 'form.recent.option.playlist_url'
                          : 'form.recent.option.video_url'
                      )}{' '}
                      · {option.url}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onRemoveRecentUrl(option.url)
                    }}
                    sx={{
                      flexShrink: 0,
                      width: 22,
                      height: 22,
                      color: 'text.disabled',
                      '&:hover': { color: 'error.main', bgcolor: 'transparent' }
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Box>
              </li>
            )
          }}
          slotProps={{
            listbox: {
              sx: {
                py: 0.5,
                '& .MuiAutocomplete-option': {
                  px: 0,
                  py: 0,
                  '&.Mui-focused': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06)
                  }
                }
              }
            }
          }}
        />

        {submitting ? (
          <Fade in>
            <Alert
              severity="info"
              icon={<InfoOutlinedIcon fontSize="small" />}
              sx={{ borderRadius: 2, py: 0.75 }}
            >
              <Typography variant="body2" fontWeight={600}>
                {submitting.kind === 'playlist'
                  ? t('form.submitting.playlist')
                  : t('form.submitting.single')}
              </Typography>
            </Alert>
          </Fade>
        ) : null}
      </Stack>
    </Paper>
  )
}
