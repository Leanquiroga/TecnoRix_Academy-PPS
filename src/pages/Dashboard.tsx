import { useEffect } from 'react'
import { Container, Typography, Box, Button, Paper, Stack, Chip, CircularProgress } from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import { useNavigation } from '../hooks/useNavigation'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { goToLogin, goTo } = useNavigation()

  // Redirigir según el rol del usuario
  useEffect(() => {
    if (user?.role === 'student') {
      goTo('/student/dashboard')
    } else if (user?.role === 'teacher') {
      goTo('/teacher/dashboard')
    }
  }, [user?.role, goTo])

  // Mostrar loading mientras se redirige
  if (user?.role === 'student' || user?.role === 'teacher') {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  const handleLogout = () => {
    logout()
    goToLogin()
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ruta protegida - Solo accesible para usuarios autenticados
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Información del Usuario
            </Typography>
            <Stack spacing={1}>
              <Typography><strong>Nombre:</strong> {user?.name}</Typography>
              <Typography><strong>Email:</strong> {user?.email}</Typography>
              <Box>
                <strong>Rol: </strong>
                <Chip 
                  label={user?.role} 
                  color={user?.role === 'admin' ? 'error' : user?.role === 'teacher' ? 'primary' : 'success'}
                  size="small"
                />
              </Box>
              <Box>
                <strong>Estado: </strong>
                <Chip 
                  label={user?.status} 
                  color={user?.status === 'active' ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                ID: {user?.id}
              </Typography>
            </Stack>
          </Box>

          {user?.status === 'pending_validation' && (
            <Paper sx={{ p: 2, bgcolor: 'warning.light' }}>
              <Typography variant="body2" color="warning.dark">
                ⚠️ Tu cuenta está pendiente de validación. Un administrador debe aprobarla antes de que puedas acceder a todas las funciones.
              </Typography>
            </Paper>
          )}

          <Box>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleLogout}
              fullWidth
            >
              Cerrar Sesión
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  )
}
