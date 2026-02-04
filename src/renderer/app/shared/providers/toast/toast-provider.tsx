import { Alert, Snackbar } from '@mui/material'
import React, { useCallback, useMemo, useState } from 'react'

import { ToastContext } from './toast.context'
import type { ToastOptions, ToastSeverity } from './toast.types'

type ToastState = {
  open: boolean
  message: string
  severity: ToastSeverity
  duration: number
}

export default function ToastProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
    duration: 3000
  })

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }))
  }, [])

  const showToast = useCallback(
    (message: string, severity: ToastSeverity = 'info', options?: ToastOptions) => {
      setToast({
        open: true,
        message,
        severity,
        duration: options?.duration ?? 3000
      })
    },
    []
  )

  const value = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <Snackbar
        open={toast.open}
        autoHideDuration={toast.duration}
        onClose={hideToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={toast.severity}
          onClose={hideToast}
          variant="filled"
          sx={{
            fontWeight: 600,
            boxShadow: 4,
            fontSize: '0.95rem',
            minWidth: 300,
            color: 'white',
            '& .MuiAlert-message': { flex: 1 }
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}
