import { Container, Typography, Box, Button, Stack, Paper } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const { isAuthenticated, user } = useAuth()

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box textAlign="center">
        <Typography variant="h3" component="h1" gutterBottom>
          {import.meta.env.VITE_APP_NAME || 'TecnoRix Academy'}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Plataforma E-Learning con React + Node.js + Supabase
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
              <Button variant="contained" component={Link} to="/dashboard">
                Ir al Dashboard
              </Button>
              {user?.role === 'admin' && (
                <Button variant="outlined" component={Link} to="/admin">
                  Panel Admin
                </Button>
              )}
            </Stack>
          </Paper>
        ) : (
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" size="large" component={Link} to="/login">
              Iniciar Sesión
            </Button>
            <Button variant="outlined" size="large" component={Link} to="/register">
              Registrarse
            </Button>
          </Stack>
        )}

        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" gutterBottom>
            Testing Fase 1 - Autenticación y Roles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ✅ Backend con Express + TypeScript + Supabase<br />
            ✅ Frontend con React + Vite + MUI + Zustand<br />
            ✅ JWT Authentication & Role-based Access Control<br />
            ✅ Tests automatizados: 21/21 pasados
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}
