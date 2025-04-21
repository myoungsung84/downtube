import { Box, Button, Container, IconButton, Stack, TextField, Typography } from '@mui/material'
import { JSX, useRef } from 'react'

type NavigationBarProps = {
  onSubmit: (url: string) => void
}

export default function NavigationBar({ onSubmit }: NavigationBarProps): JSX.Element {
  const url = useRef<HTMLInputElement>(null)
  return (
    <Container>
      <Stack spacing={3}>
        {/* 상단 바: 파일 버튼 좌측, 제목 중앙 */}
        <Stack direction="row" alignItems="center">
          {/* 왼쪽: 파일 버튼 */}
          <Box sx={{ flex: 1 }}>
            <IconButton color="primary">파일</IconButton>
          </Box>

          {/* 가운데: 앱 제목 */}
          <Box sx={{ flex: 2, textAlign: 'center' }}>
            <Typography variant="h6">DownTube</Typography>
          </Box>

          {/* 오른쪽: 여백 또는 버튼 자리 (원하면 채워도 됨) */}
          <Box sx={{ flex: 1 }} />
        </Stack>

        {/* URL 입력 영역 */}
        <Stack direction="row" spacing={1}>
          <TextField
            inputRef={url}
            label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=example"
            variant="outlined"
            sx={{ flex: 8 }}
          />
          <Button
            variant="contained"
            color="primary"
            sx={{ flex: 2 }}
            onClick={() => {
              if (url.current && url.current.value) {
                onSubmit(url.current.value)
                url.current.value = ''
              }
            }}
          >
            다운로드
          </Button>
        </Stack>
      </Stack>
    </Container>
  )
}
