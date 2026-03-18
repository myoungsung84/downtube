import React from 'react'

import DialogProvider from './dialog/dialog-provider'
import ToastProvider from './toast/toast-provider'

export default function AppProviders(props: { children: React.ReactNode }): React.JSX.Element {
  return (
    <ToastProvider>
      <DialogProvider>{props.children}</DialogProvider>
    </ToastProvider>
  )
}
