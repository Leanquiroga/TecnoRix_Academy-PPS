import { Container, Typography, Box, Button, Stack, Paper } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../routes/routes.config'

export default function Home() {
  const { isAuthenticated, user } = useAuth()

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box textAlign="center">
        <Typography variant="h3" component="h1" gutterBottom>
          {import.meta.env.VITE_APP_NAME || 'TecnoRix Academy'}
        </Typography>

        {isAuthenticated ? (
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Bienvenido, {user?.name}!
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Rol: {user?.role} | Estado: {user?.status}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
              <Button variant="contained" component={Link} to={ROUTES.DASHBOARD}>
                Ir al Dashboard
              </Button>
              {user?.role === 'admin' && (
                <Button variant="outlined" component={Link} to={ROUTES.ADMIN.ROOT}>
                  Panel Admin
                </Button>
              )}
            </Stack>
          </Paper>
        ) : (
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" size="large" component={Link} to={ROUTES.LOGIN}>
              Iniciar Sesión
            </Button>
            <Button variant="outlined" size="large" component={Link} to={ROUTES.REGISTER}>
              Registrarse
            </Button>
          </Stack>
        )}

      </Box>
    </Container>
  )
}
