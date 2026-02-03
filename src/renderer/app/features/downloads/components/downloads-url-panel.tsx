import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SearchIcon from '@mui/icons-material/Search'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import {
  Alert,
  alpha,
  Button,
  Chip,
  Fade,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import React from 'react'

export default function DownloadsUrlPanel(props: {
  inputRef: React.RefObject<HTMLInputElement | null>
  submitting: null | { url: string; kind: 'playlist' | 'single' }
  onSubmit: () => void
}): React.JSX.Element {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '2px solid',
        borderColor: 'primary.main',
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(
            theme.palette.background.paper,
            1
          )} 100%)`,
        transition: 'all 0.3s ease'
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SearchIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.125rem' }}>
            영상 URL 입력
          </Typography>
          <Chip
            size="small"
            label="1단계"
            color="primary"
            variant="filled"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        <TextField
          inputRef={props.inputRef}
          placeholder="https://www.youtube.com/watch?v=... 또는 플레이리스트 URL을 붙여넣으세요"
          variant="outlined"
          fullWidth
          disabled={props.submitting !== null}
          onKeyDown={(e): void => {
            if (e.key === 'Enter') props.onSubmit()
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '1rem',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
              }
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <VideoLibraryIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="contained"
                    onClick={props.onSubmit}
                    disabled={props.submitting !== null}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      px: 4,
                      py: 1.25,
                      borderRadius: 2
                    }}
                  >
                    {props.submitting ? '처리중...' : '추가하기'}
                  </Button>
                </InputAdornment>
              )
            }
          }}
        />

        {props.submitting ? (
          <Fade in>
            <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                {props.submitting.kind === 'playlist'
                  ? '플레이리스트를 분석하고 있어요... 잠시만 기다려주세요 ⏳'
                  : '영상 정보를 확인하고 있어요... 곧 완료됩니다 🔍'}
              </Typography>
            </Alert>
          </Fade>
        ) : null}
      </Stack>
    </Paper>
  )
}
