// src/theme/dark-theme.ts
import { createTheme } from '@mui/material/styles'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0B0E14',
      paper: '#13171F'
    },
    primary: {
      main: '#5B8DEF',
      light: '#7BA5F5',
      dark: '#4A7AD9'
    },
    secondary: {
      main: '#9D6FFF',
      light: '#B48FFF',
      dark: '#8A5FE6'
    },
    text: {
      primary: '#E8EDF4',
      secondary: '#9CA9BA',
      disabled: '#5F6B7A'
    },
    success: {
      main: '#2DD4BF',
      light: '#5EEAD4',
      dark: '#14B8A6'
    },
    error: {
      main: '#F87171',
      light: '#FCA5A5',
      dark: '#EF4444'
    },
    warning: {
      main: '#FBBF24',
      light: '#FCD34D',
      dark: '#F59E0B'
    },
    info: {
      main: '#38BDF8',
      light: '#7DD3FC',
      dark: '#0EA5E9'
    },
    divider: '#1C2331'
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
    // ==============================
    // CssBaseline
    // ==============================
    MuiCssBaseline: {
      styleOverrides: `
      @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

      body {
        background: linear-gradient(
          180deg,
          #0E1420 0%,
          #090D15 50%,
          #0E1420 100%
        );
        background-attachment: fixed;
        min-height: 100vh;
        scrollbar-width: thin;
        scrollbar-color: #1E2A44 #0E1420;
      }

      #root {
        min-height: 100vh;
      }
    `
    },

    // ==============================
    // Button
    // ==============================
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,

          '&:hover': {
            backgroundColor: 'rgba(91, 141, 239, 0.08)'
          }
        },

        contained: {
          '&:hover': {
            backgroundColor: '#4A7AD9'
          }
        }
      }
    },

    // ==============================
    // Card
    // ==============================
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #1C2331'
        }
      }
    },

    // ==============================
    // Paper
    // ==============================
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },

    // ==============================
    // TextField
    // ==============================
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#1C2331'
            },

            '&:hover fieldset': {
              borderColor: '#2A3447'
            },

            '&.Mui-focused fieldset': {
              borderColor: '#5B8DEF'
            }
          }
        }
      }
    },

    // ==============================
    // Chip
    // ==============================
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500
        }
      }
    },

    // ==============================
    // IconButton
    // ==============================
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(91, 141, 239, 0.08)'
          }
        }
      }
    }
  }
})

export default darkTheme
