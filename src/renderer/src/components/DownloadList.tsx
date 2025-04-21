import { Stack } from '@mui/material'
import DownloadItem from '@renderer/components/DownloadItem'

type DownloadListProps = {
  items: []
}

export default function DownloadList({ items }: DownloadListProps): React.JSX.Element {
  console.log('DownloadList items:', items)
  return (
    <Stack>
      {items.map((item, index) => (
        <DownloadItem key={index} />
      ))}
    </Stack>
  )
}
