import { alpha, createTheme, type PaletteMode, type Theme } from '@mui/material/styles'

type ThemeTokens = {
  backgroundDefault: string
  backgroundPaper: string
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

function getTokens(mode: PaletteMode): ThemeTokens {
  if (mode === 'light') {
    return {
      backgroundDefault: '#F4F7FB',
      backgroundPaper: '#FFFFFF',
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
  }

  return {
    backgroundDefault: '#0B0E14',
    backgroundPaper: '#13171F',
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
}

export default function createAppTheme(mode: PaletteMode): Theme {
  const t = getTokens(mode)
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
          background: ${
            isDark
              ? 'linear-gradient(180deg, #0E1420 0%, #090D15 50%, #0E1420 100%)'
              : 'linear-gradient(180deg, #F8FAFD 0%, #F1F5FB 50%, #F8FAFD 100%)'
          };
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
