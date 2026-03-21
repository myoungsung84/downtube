import { Alert, Snackbar } from '@mui/material'
import React, { useCallback, useMemo, useState } from 'react'

import { ToastContext } from './toast.context'
import type { ToastOptions, ToastSeverity } from './toast.types'

type ToastState = {
  open: boolean
  message: React.ReactNode
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
    (message: React.ReactNode, severity: ToastSeverity = 'info', options?: ToastOptions) => {
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
        sx={{
          maxWidth: 'calc(100vw - 32px)'
        }}
      >
        <Alert
          severity={toast.severity}
          onClose={hideToast}
          variant="filled"
          sx={{
            alignItems: 'flex-start',
            fontWeight: 600,
            boxShadow: 4,
            fontSize: '0.95rem',
            minWidth: { xs: 0, sm: 300 },
            maxWidth: 'min(560px, calc(100vw - 32px))',
            overflow: 'hidden',
            color: 'common.white',
            '& .MuiAlert-action': {
              alignSelf: 'flex-start',
              mt: -0.25,
              mr: -0.5
            },
            '& .MuiAlert-message': {
              flex: 1,
              minWidth: 0,
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word'
            }
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}
