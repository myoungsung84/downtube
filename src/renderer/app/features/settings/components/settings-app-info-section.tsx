import { alpha, Button, Divider, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import { useDialog } from '@renderer/shared/hooks/use-dialog'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import { useUpdate } from '@renderer/shared/hooks/use-update'
import React, { useCallback } from 'react'

export function AppInfoSection(): React.JSX.Element {
  const { t } = useI18n('settings')
  const { confirm } = useDialog()
  const {
    isMacPlatform,
    isUpdateInProgress,
    isWindowsPlatform,
    openReleasePage,
    runtimeInfo,
    startUpdate,
    updateCheckStatus,
    updateProgressPercent
  } = useUpdate()

  const showUpdateUi = runtimeInfo?.isPackaged === true
  const showWindowsUpdateButton =
    showUpdateUi && isWindowsPlatform && updateCheckStatus === 'available' && !isUpdateInProgress
  const showMacReleaseButton = showUpdateUi && isMacPlatform

  const handleStartUpdate = useCallback(async (): Promise<void> => {
    if (!isWindowsPlatform || isUpdateInProgress) {
      return
    }

    const confirmed = await confirm({
      title: t('updates.dialog.title'),
      message: t('updates.dialog.message'),
      confirmText: t('updates.actions.update')
    })

    if (!confirmed) {
      return
    }

    await startUpdate()
  }, [confirm, isUpdateInProgress, isWindowsPlatform, startUpdate, t])

  const handleOpenReleasePage = useCallback(async (): Promise<void> => {
    await openReleasePage()
  }, [openReleasePage])

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(
                theme.palette.info.main,
                0.018
              )} 100%)`
            : theme.palette.background.paper
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 3, py: 2, bgcolor: 'action.hover' }}
      >
        <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1.5}>
          {t('updates.section_title')}
        </Typography>
      </Stack>

      <Divider />

      <Stack>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ px: 3, py: 2.5 }}
        >
          <Stack spacing={0.4}>
            <Typography variant="body2" fontWeight={700}>
              {t('updates.current_version.title')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('updates.current_version.description')}
            </Typography>
          </Stack>

          <Typography variant="body2" fontWeight={700}>
            {runtimeInfo?.version ?? '-'}
          </Typography>
        </Stack>

        {showUpdateUi && (showWindowsUpdateButton || showMacReleaseButton) && (
          <>
            <Divider />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 3, py: 2.5 }}
            >
              <Stack spacing={0.4}>
                <Typography variant="body2" fontWeight={700}>
                  {t('updates.actions.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('updates.actions.description')}
                </Typography>
              </Stack>

              {showWindowsUpdateButton && (
                <Button
                  variant="contained"
                  onClick={() => {
                    void handleStartUpdate()
                  }}
                >
                  {t('updates.actions.update')}
                </Button>
              )}

              {showMacReleaseButton && (
                <Button
                  variant="contained"
                  onClick={() => {
                    void handleOpenReleasePage()
                  }}
                >
                  {t('updates.actions.view_on_github')}
                </Button>
              )}
            </Stack>
          </>
        )}

        {showUpdateUi && isUpdateInProgress && (
          <>
            <Divider />
            <Stack spacing={1.25} sx={{ px: 3, py: 2.5 }}>
              <Typography variant="body2" fontWeight={700}>
                {t('updates.progress.message')}
              </Typography>
              <LinearProgress
                variant={updateProgressPercent != null ? 'determinate' : 'indeterminate'}
                value={updateProgressPercent ?? 0}
                sx={{
                  height: 6,
                  borderRadius: 999,
                  bgcolor: 'action.hover'
                }}
              />
              {updateProgressPercent != null && (
                <Typography variant="caption" color="text.secondary">
                  {t('updates.progress.percent', { percent: updateProgressPercent })}
                </Typography>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  )
}
