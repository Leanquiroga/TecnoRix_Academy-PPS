import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '../hooks/useAuth'

// Componente puente: redirige inmediatamente al dashboard específico por rol.
// TODO (fase posterior): eliminar esta ruta y usar goToDashboard() para navegar directo.
export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />
    case 'teacher':
      return <Navigate to="/teacher/dashboard" replace />
    case 'student':
      return <Navigate to="/student/dashboard" replace />
    default:
      return <Navigate to="/" replace />
  }
}
