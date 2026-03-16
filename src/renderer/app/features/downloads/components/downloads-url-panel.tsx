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
import React from 'react'

export default function DownloadsUrlPanel(props: {
  inputRef: React.RefObject<HTMLInputElement | null>
  inputValue: string
  recentUrls: string[]
  submitting: null | { url: string; kind: 'playlist' | 'single' }
  onChangeInputValue: (value: string) => void
  onClearRecentUrls: () => void
  onRemoveRecentUrl: (url: string) => void
  onSelectRecentUrl: (url: string) => void
  onSubmit: () => void
}): React.JSX.Element {
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
    ({ children, ...paperProps }: PaperProps) => (
      <Paper
        {...paperProps}
        sx={{
          mt: 0.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 8px 24px rgba(0,0,0,0.09)',
          overflow: 'hidden',
          ...paperProps.sx
        }}
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
                  최근 기록
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
                전체 삭제
              </Button>
            </Stack>
            <Divider />
          </>
        )}
        {children}
      </Paper>
    ),
    [recentUrls.length, onClearRecentUrls]
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
          주소 입력
        </Typography>

        <Autocomplete
          freeSolo
          fullWidth
          disableClearable
          filterOptions={(options) => options}
          options={recentUrls}
          inputValue={inputValue}
          disabled={submitting !== null}
          onInputChange={(_, value) => onChangeInputValue(value)}
          onChange={(_, value) => {
            if (typeof value !== 'string') return
            onSelectRecentUrl(value)
          }}
          PaperComponent={PaperWithHeader}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={inputRef}
              placeholder="영상 주소 또는 재생목록 주소를 붙여넣으세요"
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
                          {submitting ? '처리 중…' : '추가'}
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
            let domain = option
            let path = ''
            try {
              const parsed = new URL(option)
              domain = parsed.hostname
              path = parsed.pathname + parsed.search
            } catch {
              // noop
            }

            return (
              <li {...optionProps} key={option} style={{ padding: 0 }}>
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
                      alignItems: 'baseline',
                      gap: 0.25
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        flexShrink: 0,
                        fontWeight: 500,
                        fontSize: '0.82rem',
                        color: 'text.primary'
                      }}
                    >
                      {domain}
                    </Typography>
                    {path && path !== '/' && (
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.78rem',
                          color: 'text.disabled',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {path}
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onRemoveRecentUrl(option)
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
                  ? '재생목록 정보를 확인하고 있어요… 잠시만 기다려주세요 ⏳'
                  : '주소 정보를 확인하고 있어요… 곧 완료됩니다 🔍'}
              </Typography>
            </Alert>
          </Fade>
        ) : null}
      </Stack>
    </Paper>
  )
}
