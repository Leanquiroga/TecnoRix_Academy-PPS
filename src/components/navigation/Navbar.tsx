import type { MouseEvent } from 'react'
import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Dashboard,
  Settings,
  Logout,
  Brightness4,
  Brightness7,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { useNavigation } from '../../hooks/useNavigation'

interface NavbarProps {
  onMenuToggle?: () => void
  showMenuButton?: boolean
}

export function Navbar({ onMenuToggle, showMenuButton = true }: NavbarProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { user, logout } = useAuth()
  const { goToDashboard, goTo } = useNavigation()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notificationsAnchor, setNotificationsAnchor] =
    useState<null | HTMLElement>(null)

  const userMenuOpen = Boolean(anchorEl)
  const notificationsOpen = Boolean(notificationsAnchor)

  // Handlers
  const handleUserMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationsOpen = (event: MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget)
  }

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null)
  }

  const handleDashboard = () => {
    handleUserMenuClose()
    goToDashboard()
  }

  const handleSettings = () => {
    handleUserMenuClose()
    goTo('/settings')
  }

  const handleProfile = () => {
    handleUserMenuClose()
    goTo('/profile')
  }

  const handleLogout = () => {
    handleUserMenuClose()
    logout()
  }

  // TODO: Implementar toggle de tema cuando se agregue theme provider
  const handleThemeToggle = () => {
    handleUserMenuClose()
    console.log('Theme toggle - To be implemented')
  }

  // Mock notifications - TODO: Implementar sistema de notificaciones real
  const notificationCount = 3

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        {/* Menu Button (Mobile/Sidebar Toggle) */}
        {showMenuButton && (
          <IconButton
            edge="start"
            color="primary"
            aria-label="abrir menú"
            onClick={onMenuToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo y Título */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
          }}
          onClick={() => goTo('/')}
        >
          {/* TODO: Reemplazar con logo real */}
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
            }}
          >
            <Typography
              sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}
            >
              T
            </Typography>
          </Box>
          {!isMobile && (
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
              Tecnorix Academy
            </Typography>
          )}
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Search Bar - TODO: Implementar componente SearchBar */}
        {!isMobile && (
          <Box sx={{ mr: 2, minWidth: 300 }}>
            {/* Placeholder para SearchBar */}
          </Box>
        )}

        {/* Notificaciones */}
        {user && (
          <IconButton
            color="primary"
            aria-label="notificaciones"
            onClick={handleNotificationsOpen}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        )}

        {/* User Menu */}
        {user ? (
          <>
            <IconButton
              onClick={handleUserMenuOpen}
              aria-label="menú de usuario"
              aria-controls={userMenuOpen ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={userMenuOpen ? 'true' : undefined}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                }}
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>

            {/* User Menu Dropdown */}
            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              open={userMenuOpen}
              onClose={handleUserMenuClose}
              onClick={handleUserMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 3,
                sx: {
                  minWidth: 200,
                  mt: 1.5,
                },
              }}
            >
              {/* User Info */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
                <Box
                  sx={{
                    mt: 0.5,
                    px: 1,
                    py: 0.25,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: 1,
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                  }}
                >
                  {user.role}
                </Box>
              </Box>

              <Divider />

              {/* Menu Items */}
              <MenuItem onClick={handleProfile}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText>Mi Perfil</ListItemText>
              </MenuItem>

              <MenuItem onClick={handleDashboard}>
                <ListItemIcon>
                  <Dashboard fontSize="small" />
                </ListItemIcon>
                <ListItemText>Dashboard</ListItemText>
              </MenuItem>

              <MenuItem onClick={handleSettings}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                <ListItemText>Configuración</ListItemText>
              </MenuItem>

              <MenuItem onClick={handleThemeToggle}>
                <ListItemIcon>
                  {theme.palette.mode === 'dark' ? (
                    <Brightness7 fontSize="small" />
                  ) : (
                    <Brightness4 fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText>
                  {theme.palette.mode === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                </ListItemText>
              </MenuItem>

              <Divider />

              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>
                  <Typography color="error">Cerrar Sesión</Typography>
                </ListItemText>
              </MenuItem>
            </Menu>
          </>
        ) : (
          <IconButton
            onClick={() => goTo('/login')}
            aria-label="iniciar sesión"
            color="primary"
          >
            <AccountCircle />
          </IconButton>
        )}

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationsAnchor}
          open={notificationsOpen}
          onClose={handleNotificationsClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 3,
            sx: {
              minWidth: 320,
              maxWidth: 400,
              mt: 1.5,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Notificaciones
            </Typography>
          </Box>

          <Divider />

          {/* TODO: Implementar lista de notificaciones real */}
          <MenuItem onClick={handleNotificationsClose}>
            <ListItemText
              primary="Nueva inscripción aprobada"
              secondary="Hace 5 minutos"
            />
          </MenuItem>
          <MenuItem onClick={handleNotificationsClose}>
            <ListItemText
              primary="Mensaje del profesor"
              secondary="Hace 1 hora"
            />
          </MenuItem>
          <MenuItem onClick={handleNotificationsClose}>
            <ListItemText
              primary="Curso actualizado"
              secondary="Hace 2 horas"
            />
          </MenuItem>

          <Divider />

          <Box sx={{ px: 2, py: 1.5, textAlign: 'center' }}>
            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              Ver todas las notificaciones
            </Typography>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
