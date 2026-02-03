import DownloadsScreen from '@renderer/features/downloads/screens/downloads-screen'
import AppLayout from '@renderer/shared/components/layout/app-layout'
import React from 'react'

export default function MainPage(): React.JSX.Element {
  return (
    <AppLayout onDirectory={() => window.api.openDownloadDir()}>
      <DownloadsScreen />
    </AppLayout>
  )
}
