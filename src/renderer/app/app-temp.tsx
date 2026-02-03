import AppProviders from '@renderer/shared/providers/app-providers'
import { RouterProvider } from 'react-router-dom'

import { router } from './router'

export default function App(): React.JSX.Element {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
