import PlaylistRemoveIcon from '@mui/icons-material/InboxOutlined'
import { Stack, Typography } from '@mui/material'
import DownloadItem, { DownloadItemProps } from '@renderer/components/DownloadItem'
export type DownloadListProps = {
  items: DownloadItemProps[]
}

export default function DownloadList({ items }: DownloadListProps): React.JSX.Element {
  return (
    <Stack
      spacing={1}
      sx={{
        p: 2,
        flex: 1,
        minHeight: 0,
        overflowY: items.length > 0 ? 'auto' : 'hidden'
      }}
    >
      {items.map((item, index) => (
        <DownloadItem key={index} {...item} />
      ))}

      {items.length === 0 && (
        <Stack sx={{ flex: 1 }} alignItems="center" justifyContent="center">
          <PlaylistRemoveIcon
            sx={{
              fontSize: 96,
              color: 'text.secondary',
              opacity: 0.35
            }}
          />
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              opacity: 0.7
            }}
          >
            리스트가 비어 있습니다
          </Typography>
        </Stack>
      )}
    </Stack>
  )
}
