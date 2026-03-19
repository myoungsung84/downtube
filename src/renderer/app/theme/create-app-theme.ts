import { alpha, createTheme, type PaletteMode, type Theme } from '@mui/material/styles'
import type { AppThemePreset } from '@src/types/settings.types'

type ThemeTokens = {
  backgroundDefault: string
  backgroundPaper: string
  bodyGradient: string
  primaryMain: string
  primaryLight: string
  primaryDark: string
  secondaryMain: string
  secondaryLight: string
  secondaryDark: string
  textPrimary: string
  textSecondary: string
  textDisabled: string
  successMain: string
  successLight: string
  successDark: string
  errorMain: string
  errorLight: string
  errorDark: string
  warningMain: string
  warningLight: string
  warningDark: string
  infoMain: string
  infoLight: string
  infoDark: string
  divider: string
}

// slate: 라이트 전용. 쿨 블루-그레이 틴트. 배경·패널·디바이더 모두 명확히 차갑게
const LIGHT_PRESETS: Record<'default' | 'slate', Partial<ThemeTokens>> = {
  default: {},
  slate: {
    backgroundDefault: '#D4E3F5',
    backgroundPaper: '#E2EEF8',
    bodyGradient: 'linear-gradient(180deg, #DAE8F6 0%, #CCE0F2 50%, #DAE8F6 100%)',
    textSecondary: '#304C6A',
    textDisabled: '#6888AA',
    divider: '#A0BEDD'
  }
}
type LightPreset = keyof typeof LIGHT_PRESETS

// jade: 다크 전용. 극야의 틸트-블랙. 차갑고 정제된 전기감, 네온 없이 그린-청록 톤만
// aurora: 다크 전용. 딥 네이비 위 시안 중심, 아주 약한 블루-바이올렛 힌트. 차갑고 전기적인 오로라
// ink: 다크 전용. 깊은 네이비-블랙. 배경·패널·디바이더 모두 명확히 짙고 파랗게
const DARK_PRESETS: Record<'default' | 'ink' | 'jade' | 'aurora', Partial<ThemeTokens>> = {
  default: {},
  aurora: {
    backgroundDefault: '#050B12',
    backgroundPaper: '#091A2C',
    bodyGradient: 'linear-gradient(180deg, #070E1C 0%, #030A14 50%, #070E1C 100%)',
    primaryMain: '#38C4D4',
    primaryLight: '#58D4E4',
    primaryDark: '#28A4B4',
    secondaryMain: '#6870D8',
    secondaryLight: '#8890E4',
    secondaryDark: '#5058C0',
    textPrimary: '#C8E6F0',
    textSecondary: '#6090A8',
    textDisabled: '#2A4C60',
    divider: '#0C2238'
  },
  jade: {
    backgroundDefault: '#050D0C',
    backgroundPaper: '#0C1C1A',
    bodyGradient: 'linear-gradient(180deg, #071310 0%, #030A09 50%, #071310 100%)',
    primaryMain: '#4BBFB8',
    primaryLight: '#6CCFC8',
    primaryDark: '#35A09A',
    secondaryMain: '#5E7FD8',
    secondaryLight: '#7E9AE5',
    secondaryDark: '#4A65BE',
    textPrimary: '#D2EAE8',
    textSecondary: '#7AAAA8',
    textDisabled: '#3A6462',
    divider: '#0F2624'
  },
  ink: {
    backgroundDefault: '#05070F',
    backgroundPaper: '#0A1020',
    bodyGradient: 'linear-gradient(180deg, #07091A 0%, #030610 50%, #07091A 100%)',
    primaryMain: '#6A9CF8',
    primaryLight: '#8CB6FF',
    primaryDark: '#4E7EE0',
    secondaryMain: '#9070F0',
    secondaryLight: '#AA8EF8',
    secondaryDark: '#7858D4',
    textPrimary: '#D4E2F8',
    textSecondary: '#7A92BC',
    textDisabled: '#3E5272',
    divider: '#121E3A'
  }
}
type DarkPreset = keyof typeof DARK_PRESETS

const LIGHT_BASE: ThemeTokens = {
  backgroundDefault: '#F4F7FB',
  backgroundPaper: '#FFFFFF',
  bodyGradient: 'linear-gradient(180deg, #F8FAFD 0%, #F1F5FB 50%, #F8FAFD 100%)',
  primaryMain: '#2B6DEB',
  primaryLight: '#5B90F3',
  primaryDark: '#1E52BD',
  secondaryMain: '#1C8B82',
  secondaryLight: '#39AAA1',
  secondaryDark: '#166B65',
  textPrimary: '#0E1A2B',
  textSecondary: '#3D4D63',
  textDisabled: '#8A98AD',
  successMain: '#149A67',
  successLight: '#39B985',
  successDark: '#0F7A51',
  errorMain: '#D94A3A',
  errorLight: '#E57164',
  errorDark: '#B4382A',
  warningMain: '#C57A1E',
  warningLight: '#DA9A49',
  warningDark: '#9D6017',
  infoMain: '#0288D1',
  infoLight: '#31A7E5',
  infoDark: '#0169A5',
  divider: '#D7E0EC'
}

const DARK_BASE: ThemeTokens = {
  backgroundDefault: '#0B0E14',
  backgroundPaper: '#13171F',
  bodyGradient: 'linear-gradient(180deg, #0E1420 0%, #090D15 50%, #0E1420 100%)',
  primaryMain: '#5B8DEF',
  primaryLight: '#7BA5F5',
  primaryDark: '#4A7AD9',
  secondaryMain: '#9D6FFF',
  secondaryLight: '#B48FFF',
  secondaryDark: '#8A5FE6',
  textPrimary: '#E8EDF4',
  textSecondary: '#9CA9BA',
  textDisabled: '#5F6B7A',
  successMain: '#2DD4BF',
  successLight: '#5EEAD4',
  successDark: '#14B8A6',
  errorMain: '#F87171',
  errorLight: '#FCA5A5',
  errorDark: '#EF4444',
  warningMain: '#FBBF24',
  warningLight: '#FCD34D',
  warningDark: '#F59E0B',
  infoMain: '#38BDF8',
  infoLight: '#7DD3FC',
  infoDark: '#0EA5E9',
  divider: '#1C2331'
}

function resolveLightPreset(preset: AppThemePreset): LightPreset {
  return preset === 'slate' ? 'slate' : 'default'
}

function resolveDarkPreset(preset: AppThemePreset): DarkPreset {
  if (preset === 'ink') return 'ink'
  if (preset === 'jade') return 'jade'
  if (preset === 'aurora') return 'aurora'
  return 'default'
}

function getTokens(mode: PaletteMode, preset: AppThemePreset): ThemeTokens {
  if (mode === 'light') {
    const overrides = LIGHT_PRESETS[resolveLightPreset(preset)]
    return { ...LIGHT_BASE, ...overrides }
  }

  const overrides = DARK_PRESETS[resolveDarkPreset(preset)]
  return { ...DARK_BASE, ...overrides }
}

export default function createAppTheme(
  mode: PaletteMode,
  preset: AppThemePreset = 'default'
): Theme {
  const t = getTokens(mode, preset)
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      background: {
        default: t.backgroundDefault,
        paper: t.backgroundPaper
      },
      primary: {
        main: t.primaryMain,
        light: t.primaryLight,
        dark: t.primaryDark
      },
      secondary: {
        main: t.secondaryMain,
        light: t.secondaryLight,
        dark: t.secondaryDark
      },
      text: {
        primary: t.textPrimary,
        secondary: t.textSecondary,
        disabled: t.textDisabled
      },
      success: {
        main: t.successMain,
        light: t.successLight,
        dark: t.successDark
      },
      error: {
        main: t.errorMain,
        light: t.errorLight,
        dark: t.errorDark
      },
      warning: {
        main: t.warningMain,
        light: t.warningLight,
        dark: t.warningDark
      },
      info: {
        main: t.infoMain,
        light: t.infoLight,
        dark: t.infoDark
      },
      divider: t.divider
    },
    shape: {
      borderRadius: 8
    },
    typography: {
      fontFamily:
        '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
      button: {
        textTransform: 'none',
        fontWeight: 600
      }
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
        body {
          background: ${t.bodyGradient};
          background-attachment: fixed;
          min-height: 100vh;
        }

        #root {
          min-height: 100vh;
        }
      `
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: alpha(t.primaryMain, isDark ? 0.08 : 0.1)
            }
          },
          contained: {
            boxShadow: isDark ? undefined : `0 1px 2px ${alpha('#0F172A', 0.12)}`,
            '&:hover': {
              backgroundColor: t.primaryDark,
              boxShadow: isDark ? undefined : `0 1px 4px ${alpha(t.primaryMain, 0.18)}`
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${t.divider}`
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: isDark ? undefined : `0 1px 2px ${alpha('#0F172A', 0.06)}`
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: t.divider
              },
              '&:hover fieldset': {
                borderColor: alpha(t.textPrimary, isDark ? 0.22 : 0.3)
              },
              '&.Mui-focused fieldset': {
                borderColor: t.primaryMain
              }
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: alpha(t.primaryMain, isDark ? 0.08 : 0.1)
            }
          }
        }
      }
    }
  })
}
