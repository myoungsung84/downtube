import { Box } from '@mui/material'

export type ThumbnailProps = {
  url: string
  w: number | string
  h: number | string
  onClick?: () => void
}

export default function Thumbnail({ url, w, h, onClick }: ThumbnailProps): React.JSX.Element {
  return (
    <Box
      sx={{
        width: w,
        height: h,
        background: `url('${url}')`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        borderRadius: 1
      }}
      onClick={onClick}
    />
  )
}
