export type ToastSeverity = 'success' | 'error' | 'info' | 'warning'

export type ToastOptions = {
  duration?: number
}

export type ToastContextValue = {
  showToast: (message: string, severity?: ToastSeverity, options?: ToastOptions) => void
  hideToast: () => void
}
