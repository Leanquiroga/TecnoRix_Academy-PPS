import { AppBar, Toolbar, Typography, Box, Button, Stack, IconButton, useTheme } from '@mui/material'
import { Brightness4, Brightness7 } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routes.config'
import { useAuth } from '../../hooks/useAuth'
import { useThemeStore } from '../../store/theme.store'

/**
 * Navbar pública minimal para la landing y páginas informativas.
 * No muestra avatar, menú de usuario ni notificaciones.
 */
export function PublicNavbar() {
  const { isAuthenticated } = useAuth()
  const { toggleMode } = useThemeStore()
  const theme = useTheme()

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        {/* Logo / Marca */}
        <Box
          component={Link}
          to={ROUTES.HOME}
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none'
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5
            }}
          >
            <Typography sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>T</Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Tecnorix Academy
          </Typography>
        </Box>

        {/* Links de navegación básica */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Button component={Link} to={ROUTES.COURSES} color="primary" variant="text">
            Cursos
          </Button>
          <Button component={Link} to="/about" color="primary" variant="text">
            Nosotros
          </Button>
          <Button component={Link} to="/contact" color="primary" variant="text">
            Contacto
          </Button>
        </Stack>

        {/* CTA Autenticación + Theme Toggle */}
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            aria-label="Cambiar tema"
            onClick={toggleMode}
            color="primary"
            size="small"
          >
            {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          {isAuthenticated ? (
            <Button
              component={Link}
              to={ROUTES.DASHBOARD}
              variant="contained"
              color="primary"
            >
              Ir al Dashboard
            </Button>
          ) : (
            <>
              <Button component={Link} to={ROUTES.LOGIN} color="primary">
                Iniciar Sesión
              </Button>
              <Button
                component={Link}
                to={ROUTES.REGISTER}
                variant="contained"
                color="primary"
              >
                Crear Cuenta
              </Button>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default PublicNavbar