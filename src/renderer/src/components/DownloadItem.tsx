import { Stack, Typography } from '@mui/material'

import Thumbnail from './Thumbnail'

export default function DownloadItem(): React.JSX.Element {
  return (
    <Stack
      sx={{ padding: 2, borderBottom: '1px solid #ccc' }}
      direction="row"
      alignItems="flex-start"
    >
      <Thumbnail url="https://i.ytimg.com/vi/gAaaoHBn0_U/hq720.jpg" w="151px !important" h={85} />

      {/* ✅ 남은 공간을 다 채우는 영역 */}
      <Stack alignItems="flex-start" sx={{ ml: 2, height: '100%', flex: 1 }}>
        <Typography
          noWrap
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          KR 탐색 건너뛰기 검색 만들기 아바타 이미지 아노 1800 6배속 무편집 게임플레이(23): 신대륙
          고급 상품 생산하기 KR 탐색 건너뛰기 검색 만들기 아바타 이미지 아노 1800 6배속 무편집
          게임플레이(23): 신대륙 고급 상품 생산하기 KR 탐색 건너뛰기 검색 만들기 아바타 이미지 아노
          1800 6배속 무편집 게임플레이(23): 신대륙 고급 상품 생산하기
        </Typography>
      </Stack>
    </Stack>
  )
}
