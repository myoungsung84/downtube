import React from 'react'

import ToastProvider from './toast/toast-provider'

export default function AppProviders(props: { children: React.ReactNode }): React.JSX.Element {
  return <ToastProvider>{props.children}</ToastProvider>
}
