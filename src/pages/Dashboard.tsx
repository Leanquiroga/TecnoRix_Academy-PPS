import { Container, Typography, Box, Button, Paper, Stack, Chip } from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
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
