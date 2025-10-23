import { useState } from 'react'
import type { ReactNode } from 'react'
import { Box, Container } from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import { Navbar } from '../components/navigation/Navbar'
import { Sidebar } from '../components/navigation/Sidebar'

interface AppLayoutProps {
  children: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
  disablePadding?: boolean
  showNavbar?: boolean
  showSidebar?: boolean
}

/**
 * Layout principal de la aplicación
 * Incluye navbar, sidebar (opcional) y área de contenido
 */
export function AppLayout({
  children,
  maxWidth = 'lg',
  disablePadding = false,
  showNavbar = true,
  showSidebar = true,
}: AppLayoutProps) {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Determinar si mostrar sidebar según autenticación
  const shouldShowSidebar = showSidebar && isAuthenticated

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMobileClose = () => {
    setMobileOpen(false)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Navbar */}
      {showNavbar && (
        <Navbar
          onMenuToggle={handleMobileToggle}
          showMenuButton={shouldShowSidebar}
        />
      )}

      <Box
        sx={{
          display: 'flex',
          flex: 1,
          pt: showNavbar ? '64px' : 0,
        }}
      >
        {/* Desktop Sidebar */}
        {shouldShowSidebar && (
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Sidebar
              variant="permanent"
              open={sidebarOpen}
              collapsed={!sidebarOpen}
              onToggle={handleSidebarToggle}
            />
          </Box>
        )}

        {/* Mobile Drawer */}
        {shouldShowSidebar && (
          <Box
           sx={{ 
            display: { xs: 'block', md: 'none' }, 
            position: 'fixed',
            zIndex: (theme) => theme.zIndex.drawer + 1,}}>
            <Sidebar
              variant="temporary"
              open={mobileOpen}
              onClose={handleMobileClose}
            />
          </Box>
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            transition: (theme) =>
              theme.transitions.create('margin-left', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          }}
        >
          {disablePadding ? (
            <Box sx={{ flex: 1 }}>{children}</Box>
          ) : (
            <Container
              maxWidth={maxWidth}
              sx={{
                py: 3,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {children}
            </Container>
          )}

          {/* Footer */}
          <Box
            component="footer"
            sx={{
              py: 2,
              px: 2,
              mt: 'auto',
              bgcolor: 'background.paper',
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Container maxWidth={maxWidth}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
                  © 2025 Tecnorix Academy. Todos los derechos reservados.
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    typography: 'body2',
                    color: 'text.secondary',
                  }}
                >
                  <Box component="a" href="/about" sx={{ color: 'inherit' }}>
                    Nosotros
                  </Box>
                  <Box component="a" href="/contact" sx={{ color: 'inherit' }}>
                    Contacto
                  </Box>
                  <Box component="a" href="/privacy" sx={{ color: 'inherit' }}>
                    Privacidad
                  </Box>
                </Box>
              </Box>
            </Container>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default AppLayout
