import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined'
import { Box, SxProps } from '@mui/material'
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
        bgcolor: '#000',
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
            color: 'rgba(255,255,255,0.35)',
            bgcolor: 'rgba(255,255,255,0.04)'
          }}
        >
          <BrokenImageOutlinedIcon sx={{ fontSize: 28 }} />
        </Box>
      )}
    </Box>
  )
}
