import SettingsScreen from '@renderer/features/settings/screens/settings-screen'
import AppLayout from '@renderer/shared/components/layout/app-layout'
import React from 'react'

export default function SettingsPage(): React.JSX.Element {
  return (
    <AppLayout onDirectory={() => window.api.openDownloadDir()}>
      <SettingsScreen />
    </AppLayout>
  )
}
