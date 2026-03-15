import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined'
import { Box, SxProps } from '@mui/material'
import { alpha } from '@mui/material/styles'
import * as React from 'react'

type ThumbnailProps = {
  url?: string | null
  w: number | string
  h: number | string
  onClick?: () => void
  alt?: string
  sx?: SxProps
}

export default function Thumbnail({
  url,
  w,
  h,
  onClick,
  alt = 'thumbnail',
  sx
}: ThumbnailProps): React.JSX.Element {
  const safeUrl = url ?? undefined

  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    setFailed(false)
  }, [safeUrl])

  const showImage = Boolean(safeUrl) && !failed

  return (
    <Box
      onClick={onClick}
      sx={{
        width: w,
        height: h,
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'common.black',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',

        transition: 'filter 120ms ease',
        '&:hover': onClick ? { filter: 'brightness(1.05)' } : undefined,
        ...sx
      }}
      role={onClick ? 'button' : undefined}
    >
      {showImage ? (
        <Box
          component="img"
          src={safeUrl}
          alt={alt}
          onError={() => setFailed(true)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            color: (theme) => alpha(theme.palette.common.white, 0.35),
            bgcolor: (theme) => alpha(theme.palette.common.white, 0.06)
          }}
        >
          <BrokenImageOutlinedIcon sx={{ fontSize: 28 }} />
        </Box>
      )}
    </Box>
  )
}
