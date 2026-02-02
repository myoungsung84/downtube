import { Stack, Typography } from '@mui/material'
import DownloadItem, { DownloadItemProps } from '@renderer/components/DownloadItem'
import { useAssetPath } from '@renderer/hooks/useAssetPath'

export type DownloadListProps = {
  items: DownloadItemProps[]
}

export default function DownloadList({ items }: DownloadListProps): React.JSX.Element {
  const emptyIcon = useAssetPath('empty.svg')

  return (
    <Stack spacing={1} sx={{ padding: 2 }}>
      {items.map((item, index) => (
        <DownloadItem key={index} {...item} />
      ))}
      {items.length === 0 && (
        <Stack height="540px" alignItems="center" justifyContent="center" spacing={2}>
          <img src={emptyIcon} alt="empty" width={120} height={120} style={{ opacity: 0.6 }} />
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontWeight: 500
            }}
          >
            리스트가 비어 있습니다.
          </Typography>
        </Stack>
      )}
    </Stack>
  )
}
