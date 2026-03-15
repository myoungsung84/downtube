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
      backgroundDefault: '#F6F8FC',
      backgroundPaper: '#FFFFFF',
      primaryMain: '#2563EB',
      primaryLight: '#4F83F1',
      primaryDark: '#1D4ED8',
      secondaryMain: '#0EA5A4',
      secondaryLight: '#2CC9C6',
      secondaryDark: '#0C8A89',
      textPrimary: '#0F172A',
      textSecondary: '#334155',
      textDisabled: '#94A3B8',
      successMain: '#0F9D58',
      successLight: '#34C27A',
      successDark: '#0A7D45',
      errorMain: '#D93025',
      errorLight: '#E45A50',
      errorDark: '#B42318',
      warningMain: '#C77700',
      warningLight: '#E19B2B',
      warningDark: '#A35E00',
      infoMain: '#0288D1',
      infoLight: '#31A7E5',
      infoDark: '#0169A5',
      divider: '#D9E1EC'
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
              : 'linear-gradient(180deg, #F7FAFF 0%, #F2F6FC 50%, #F7FAFF 100%)'
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
              backgroundColor: alpha(t.primaryMain, isDark ? 0.08 : 0.12)
            }
          },
          contained: {
            '&:hover': {
              backgroundColor: t.primaryDark
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
            backgroundImage: 'none'
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
              backgroundColor: alpha(t.primaryMain, isDark ? 0.08 : 0.12)
            }
          }
        }
      }
    }
  })
}
