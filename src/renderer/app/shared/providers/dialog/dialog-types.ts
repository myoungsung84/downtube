export type DialogVariant = 'default' | 'danger' | 'success'

export type BaseDialogOptions = {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
}

export type AlertDialogOptions = BaseDialogOptions

export type ConfirmDialogOptions = BaseDialogOptions

export type DialogContextValue = {
  alert: (options: AlertDialogOptions) => Promise<void>
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>
}

export type DialogState =
  | {
      open: false
      type: null
      options: null
    }
  | {
      open: true
      type: 'alert'
      options: AlertDialogOptions
    }
  | {
      open: true
      type: 'confirm'
      options: ConfirmDialogOptions
    }
