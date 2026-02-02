// src/theme/dark-theme.ts
import { createTheme } from '@mui/material/styles'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0F0F0F',
      paper: '#181818'
    },
    primary: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB'
    },
    secondary: {
      main: '#8B5CF6',
      light: '#A78BFA',
      dark: '#7C3AED'
    },
    text: {
      primary: '#E5E5E5',
      secondary: '#A1A1A1',
      disabled: '#6B6B6B'
    },
    success: {
      main: '#22C55E',
      light: '#4ADE80',
      dark: '#16A34A'
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626'
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706'
    },
    info: {
      main: '#06B6D4',
      light: '#22D3EE',
      dark: '#0891B2'
    },
    divider: '#262626'
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
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        
        body {
          backgroundColor: #0F0F0F;
          scrollbarWidth: thin;
          scrollbarColor: #262626 #0F0F0F;
        }
      `
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.08)'
          }
        },
        contained: {
          '&:hover': {
            backgroundColor: '#2563EB'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #262626'
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
              borderColor: '#262626'
            },
            '&:hover fieldset': {
              borderColor: '#404040'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3B82F6'
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
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }
        }
      }
    }
  }
})

export default darkTheme
