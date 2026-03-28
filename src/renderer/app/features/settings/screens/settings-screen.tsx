import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Box, Stack, Typography } from '@mui/material'
import { AppInfoSection } from '@renderer/features/settings/components/app-info-section'
import { AppearanceSection } from '@renderer/features/settings/components/appearance-section'
import { DownloadsSection } from '@renderer/features/settings/components/downloads-section'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import React from 'react'

export default function SettingsScreen(): React.JSX.Element {
  const { t } = useI18n('settings')

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack sx={{ width: '100%', maxWidth: 1400, p: 3 }} spacing={3}>
        {/* Header */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <SettingsOutlinedIcon sx={{ fontSize: 20, color: 'primary.contrastText' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.1}>
              {t('header.title')}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {t('header.description')}
            </Typography>
          </Box>
        </Stack>

        <AppInfoSection />
        <AppearanceSection />
        <DownloadsSection />
      </Stack>
    </Box>
  )
}
