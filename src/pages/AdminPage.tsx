import { Container, Typography, Paper, Box } from '@mui/material'
import { useAuth } from '../hooks/useAuth'

export default function AdminPage() {
  const { user } = useAuth()

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Panel de Administración
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Ruta protegida - Solo accesible para administradores
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography><strong>Usuario:</strong> {user?.name}</Typography>
          <Typography><strong>Rol:</strong> {user?.role}</Typography>
        </Box>
      </Paper>
    </Container>
  )
}
