import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { useThemeStore } from './store/theme.store'
import { createAppTheme } from './theme/theme'
import './index.css'
import AppRoutes from './routes/AppRoutes'
import { NotificationProvider } from './components/common/NotificationProvider'

function Root() {
  const mode = useThemeStore(s => s.mode)
  const theme = createAppTheme(mode)
  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </ThemeProvider>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
