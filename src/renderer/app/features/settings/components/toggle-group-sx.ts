import { alpha } from '@mui/material'
import type { Theme } from '@mui/material/styles'

export const TOGGLE_GROUP_SX = {
  bgcolor: 'action.hover',
  borderRadius: '10px',
  p: 0.5,
  border: '1px solid',
  borderColor: (theme: Theme) =>
    theme.palette.mode === 'light'
      ? alpha(theme.palette.primary.main, 0.15)
      : alpha(theme.palette.common.white, 0.06),
  gap: 0.5,
  '& .MuiToggleButtonGroup-grouped': {
    border: 'none !important',
    borderRadius: '8px !important',
    m: 0
  },
  '& .MuiToggleButton-root': {
    px: 2.25,
    py: 0.875,
    fontWeight: 600,
    fontSize: '0.8rem',
    color: 'text.secondary',
    transition: 'all 0.18s ease',
    '&.Mui-selected': {
      bgcolor: (theme: Theme) =>
        theme.palette.mode === 'light'
          ? alpha(theme.palette.primary.main, 0.1)
          : theme.palette.background.paper,
      color: 'text.primary',
      boxShadow: (theme: Theme) =>
        theme.palette.mode === 'light'
          ? `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.24)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.08)}`
          : `0 1px 4px ${alpha(theme.palette.common.black, 0.15)}`,
      '&:hover': {
        bgcolor: (theme: Theme) =>
          theme.palette.mode === 'light'
            ? alpha(theme.palette.primary.main, 0.14)
            : theme.palette.background.paper
      }
    },
    '&:hover:not(.Mui-selected)': {
      bgcolor: (theme: Theme) =>
        theme.palette.mode === 'light'
          ? alpha(theme.palette.primary.main, 0.06)
          : theme.palette.action.selected
    }
  }
}
