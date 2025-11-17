// ============================================
// TEACHER PENDING - FASE 6.5
// ============================================
// Página de confirmación tras enviar solicitud de profesor

import { useLocation, Navigate, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  CheckCircleOutline as CheckIcon,
  Schedule as ClockIcon,
  Email as EmailIcon,
  Description as DocIcon,
} from '@mui/icons-material'

export default function TeacherPending() {
  const location = useLocation()
  const email = location.state?.email

  // Si no hay email en el state, redirigir a home
  if (!email) {
    return <Navigate to="/" replace />
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header con ícono de éxito */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CheckIcon
            sx={{
              fontSize: 80,
              color: 'success.main',
              mb: 2,
            }}
          />
          <Typography variant="h4" gutterBottom>
            ¡Solicitud Enviada Exitosamente!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hemos recibido tu solicitud para convertirte en profesor en TecnoRix Academy
          </Typography>
        </Box>

        {/* Alert informativo */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Tu solicitud está siendo revisada por nuestro equipo de administración.
            Te notificaremos por email a <strong>{email}</strong> cuando tu solicitud sea procesada.
          </Typography>
        </Alert>

        {/* Qué sigue */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          ¿Qué sigue ahora?
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <ClockIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Revisión de tu solicitud"
              secondary="Nuestro equipo revisará tu perfil y credenciales en las próximas 48-72 horas"
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <DocIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Verificación de credenciales"
              secondary="Validaremos cada una de las credenciales que subiste para asegurar la calidad de nuestra plataforma"
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <EmailIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Notificación por email"
              secondary="Te enviaremos un email cuando tu solicitud sea aprobada o si necesitamos más información"
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <CheckIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Aprobación y bienvenida"
              secondary="Una vez aprobado, podrás iniciar sesión y comenzar a crear cursos inmediatamente"
            />
          </ListItem>
        </List>

        {/* Información adicional */}
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Importante:</strong> No podrás iniciar sesión hasta que tu solicitud sea aprobada.
            Si tienes alguna duda, contacta a soporte@tecnorixed.com
          </Typography>
        </Alert>

        {/* Botón volver al inicio */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            size="large"
          >
            Volver al Inicio
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
