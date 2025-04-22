import { Stack } from '@mui/material'
import DownloadItem, { DownloadItemProps } from '@renderer/components/DownloadItem'

export type DownloadListProps = {
  items: DownloadItemProps[]
}

export default function DownloadList({ items }: DownloadListProps): React.JSX.Element {
  return (
    <Stack>
      {items.map((item, index) => (
        <DownloadItem key={index} {...item} />
      ))}
    </Stack>
  )
}
