import ToastProvider from '@renderer/shared/providers/toast/toast-provider'
import { RouterProvider } from 'react-router-dom'

import { router } from './router'

export default function App(): React.JSX.Element {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  )
}
