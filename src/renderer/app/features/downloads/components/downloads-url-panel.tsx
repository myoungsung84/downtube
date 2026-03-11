import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import {
  Alert,
  Button,
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
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" fontWeight={700} color="text.secondary">
            URL 입력
          </Typography>
        </Stack>

        <TextField
          inputRef={props.inputRef}
          placeholder="YouTube URL 또는 플레이리스트 주소를 붙여넣으세요"
          variant="outlined"
          fullWidth
          disabled={props.submitting !== null}
          onKeyDown={(e): void => {
            if (e.key === 'Enter') props.onSubmit()
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.85rem',
              pr: 0.75,
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
              startAdornment: (
                <InputAdornment position="start">
                  <VideoLibraryIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="contained"
                    onClick={props.onSubmit}
                    disabled={props.submitting !== null}
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
                    {props.submitting ? '처리 중…' : '추가'}
                  </Button>
                </InputAdornment>
              )
            }
          }}
        />

        {props.submitting ? (
          <Fade in>
            <Alert
              severity="info"
              icon={<InfoOutlinedIcon fontSize="small" />}
              sx={{ borderRadius: 2, py: 0.75 }}
            >
              <Typography variant="body2" fontWeight={600}>
                {props.submitting.kind === 'playlist'
                  ? '플레이리스트를 분석하고 있어요… 잠시만 기다려주세요 ⏳'
                  : '영상 정보를 확인하고 있어요… 곧 완료됩니다 🔍'}
              </Typography>
            </Alert>
          </Fade>
        ) : null}
      </Stack>
    </Paper>
  )
}
