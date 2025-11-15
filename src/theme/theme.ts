import { createTheme, alpha } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'

declare module '@mui/material/styles' {
  interface ThemeOptions {
    custom?: {
      answerBgCorrect?: string
      answerBgIncorrect?: string
    }
  }
  interface Theme {
    custom: {
      answerBgCorrect: string
      answerBgIncorrect: string
    }
  }
}

export const createAppTheme = (mode: PaletteMode) => {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      // Usamos paleta por defecto de MUI (primary #1976d2, secondary #9c27b0)
      ...(isDark
        ? {
            background: {
              default: '#121212',
              paper: '#1E1E1E',
            },
          }
        : {
            background: {
              default: '#f7f9fc',
              paper: '#ffffff',
            },
          }),
    },
    typography: {
      fontFamily: 'Inter, Roboto, Arial, sans-serif',
    },
    custom: {
      answerBgCorrect: alpha('#2e7d32', isDark ? 0.25 : 0.15),
      answerBgIncorrect: alpha('#d32f2f', isDark ? 0.25 : 0.15),
    },
  })
}

// Tema por defecto (light) para inicialización previa a la carga del store
export const theme = createAppTheme('light')
export default theme