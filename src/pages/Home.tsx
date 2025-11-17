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
          <>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="contained" size="large" component={Link} to={ROUTES.LOGIN}>
                Iniciar Sesión
              </Button>
              <Button variant="outlined" size="large" component={Link} to={ROUTES.REGISTER}>
                Registrarse
              </Button>
            </Stack>
            
            <Paper elevation={1} sx={{ mt: 4, p: 3, bgcolor: 'primary.50' }}>
              <Typography variant="h6" gutterBottom color="primary">
                ¿Quieres enseñar en TecnoRix Academy?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Comparte tu conocimiento y ayuda a miles de estudiantes a aprender
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/register/teacher"
              >
                Registrarse como Profesor
              </Button>
            </Paper>
          </>
        )}

      </Box>
    </Container>
  )
}
