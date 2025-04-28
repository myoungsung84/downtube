import { Stack, Typography } from '@mui/material'
import DownloadItem, { DownloadItemProps } from '@renderer/components/DownloadItem'
import { useAssetPath } from '@renderer/hooks/useAssetPath'

export type DownloadListProps = {
  items: DownloadItemProps[]
}

export default function DownloadList({ items }: DownloadListProps): React.JSX.Element {
  const emptyIcon = useAssetPath('empty.svg')
  return (
    <Stack>
      {items.map((item, index) => (
        <DownloadItem key={index} {...item} />
      ))}
      {items.length === 0 && (
        <Stack height={'540px'} sx={{ padding: 2 }} alignItems="center" justifyContent={'center'}>
          <img src={emptyIcon} alt="empty" width={100} height={100} />
          <Typography variant="caption" sx={{ color: '#ccc' }}>
            리스트가 비어 있습니다.
          </Typography>
        </Stack>
      )}
    </Stack>
  )
}
