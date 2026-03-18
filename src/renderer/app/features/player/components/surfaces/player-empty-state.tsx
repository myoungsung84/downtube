import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import React from 'react'

export function PlayerEmptyState(): React.JSX.Element {
  const { t } = useI18n('player')
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        color: 'common.white',
        textAlign: 'center',
        px: 3,
        width: '100%',
        height: '100%'
      }}
    >
      <Typography variant="h6">{t('empty.title')}</Typography>
      <Typography variant="body2" sx={{ color: (theme) => alpha(theme.palette.common.white, 0.5) }}>
        {t('empty.description')}
      </Typography>
    </Box>
  )
}
