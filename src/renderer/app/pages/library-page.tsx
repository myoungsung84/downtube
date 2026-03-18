import LibraryScreen from '@renderer/features/library/screens/library-screen'
import AppLayout from '@renderer/shared/components/layout/app-layout'
import React from 'react'

export default function LibraryPage(): React.JSX.Element {
  return (
    <AppLayout>
      <LibraryScreen />
    </AppLayout>
  )
}
