import { Box, Container, Typography, Stack, Link as MuiLink } from '@mui/material'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routes.config'

export function Footer() {
  return (
    <Box component="footer" sx={{ pt: 6, pb: 4, mt: 8, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            © {new Date().getFullYear()} TecnoRix Academy. Todos los derechos reservados.
          </Typography>
          <Stack direction="row" spacing={3}>
            <MuiLink component={Link} to={ROUTES.HOME} underline="none" color="primary.main">Home</MuiLink>
            <MuiLink component={Link} to={ROUTES.COURSES} underline="none" color="primary.main">Cursos</MuiLink>
            <MuiLink component={Link} to={ROUTES.LOGIN} underline="none" color="primary.main">Login</MuiLink>
            <MuiLink component={Link} to={ROUTES.REGISTER} underline="none" color="primary.main">Registro</MuiLink>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

export default Footer
