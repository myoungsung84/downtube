import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DialogContext } from './dialog-context'
import type {
  AlertDialogOptions,
  ConfirmDialogOptions,
  DialogContextValue,
  DialogState
} from './dialog-types'

const INITIAL_DIALOG_STATE: DialogState = {
  open: false,
  type: null,
  options: null
}

type IconConfig = {
  icon: React.ReactNode
  color: string
  bgAlpha: number
}

function useIconConfig(
  variant: string | undefined,
  primaryColor: string,
  errorColor: string,
  successColor: string
): IconConfig {
  if (variant === 'danger') {
    return {
      icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 20 }} />,
      color: errorColor,
      bgAlpha: 0.1
    }
  }
  if (variant === 'success') {
    return {
      icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 20 }} />,
      color: successColor,
      bgAlpha: 0.1
    }
  }
  return {
    icon: <InfoOutlinedIcon sx={{ fontSize: 20 }} />,
    color: primaryColor,
    bgAlpha: 0.1
  }
}

export default function DialogProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [dialog, setDialog] = useState<DialogState>(INITIAL_DIALOG_STATE)
  const resolverRef = useRef<((result?: boolean) => void) | null>(null)

  useEffect(() => {
    return () => {
      resolverRef.current?.(false)
      resolverRef.current = null
    }
  }, [])

  function closeDialog(result?: boolean): void {
    const resolver = resolverRef.current
    resolverRef.current = null
    setDialog(INITIAL_DIALOG_STATE)
    resolver?.(result)
  }

  const alert = useCallback((options: AlertDialogOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      resolverRef.current?.()
      resolverRef.current = () => resolve()
      setDialog({ open: true, type: 'alert', options })
    })
  }, [])

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current?.(false)
      resolverRef.current = (result) => resolve(result ?? false)
      setDialog({ open: true, type: 'confirm', options })
    })
  }, [])

  function handleClose(): void {
    closeDialog(dialog.type === 'confirm' ? false : undefined)
  }

  const value = useMemo<DialogContextValue>(() => ({ alert, confirm }), [alert, confirm])

  const isDanger = dialog.options?.variant === 'danger'
  const confirmButtonColor = isDanger ? 'error' : 'primary'
  const confirmText = dialog.options?.confirmText ?? (dialog.type === 'confirm' ? '확인' : '닫기')
  const cancelText = dialog.options?.cancelText ?? '취소'

  const iconConfig = useIconConfig(
    dialog.options?.variant,
    theme.palette.primary.main,
    theme.palette.error.main,
    theme.palette.success.main
  )

  return (
    <DialogContext.Provider value={value}>
      {children}

      <Dialog
        open={dialog.open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        transitionDuration={0}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              bgcolor: alpha(theme.palette.common.black, isDark ? 0.55 : 0.35)
            }
          },
          paper: {
            sx: {
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: isDark
                ? alpha(theme.palette.common.white, 0.08)
                : alpha(theme.palette.common.black, 0.09),
              boxShadow: isDark
                ? `0 24px 48px ${alpha(theme.palette.common.black, 0.5)}`
                : `0 16px 40px ${alpha(theme.palette.common.black, 0.12)}`,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.92)
                : theme.palette.background.paper
            }
          }
        }}
      >
        <DialogTitle sx={{ pb: 0.75, pt: 2.25, px: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1.75,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                color: iconConfig.color,
                bgcolor: alpha(iconConfig.color, isDark ? 0.15 : iconConfig.bgAlpha)
              }}
            >
              {iconConfig.icon}
            </Box>
            <Typography fontWeight={700} fontSize="0.95rem" lineHeight={1.3}>
              {dialog.options?.title}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.25, pb: 1.5, px: 2.5 }}>
          <Typography variant="body2" color="text.secondary" lineHeight={1.65} sx={{ pl: '46px' }}>
            {dialog.options?.message}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2.25, pt: 0.5, gap: 0.75, justifyContent: 'flex-end' }}>
          {dialog.type === 'confirm' && (
            <Button
              onClick={() => closeDialog(false)}
              size="small"
              sx={{
                fontSize: '0.8rem',
                color: 'text.secondary',
                borderColor: 'divider',
                '&:hover': { color: 'text.primary' }
              }}
              variant="outlined"
            >
              {cancelText}
            </Button>
          )}

          <Button
            onClick={() => closeDialog(dialog.type === 'confirm' ? true : undefined)}
            color={confirmButtonColor}
            variant="contained"
            disableElevation
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            {confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </DialogContext.Provider>
  )
}
