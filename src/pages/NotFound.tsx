import { Container, Typography, Box, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box textAlign="center">
        <Typography variant="h4" component="h1" gutterBottom>
          404 - Página no encontrada
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          La ruta que estás buscando no existe.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained">
          Volver al inicio
        </Button>
      </Box>
    </Container>
  )
}
