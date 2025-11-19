import { Box, Container, Typography, Stack, Button, Paper } from '@mui/material'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routes.config'
import { useNavigation } from '../../hooks/useNavigation'

export function Hero() {
  const { isAuthenticated, user } = useAuth()
  const { goToDashboard } = useNavigation()

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        pt: { xs: 10, md: 14 },
        pb: { xs: 8, md: 12 },
        minHeight: { xs: '60vh', md: '65vh' },
        display: 'flex',
        alignItems: 'center',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 60%)`,
        color: 'primary.contrastText'
      }}
    >
      <Container maxWidth="md">
        <Typography
          component="h1"
          variant="h3"
          sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}
        >
          Domina el futuro con TecnoRix Academy
        </Typography>
        <Typography
          component="p"
          variant="h6"
          sx={{ opacity: 0.9, mb: 4, textAlign: 'center', fontWeight: 400 }}
        >
          Aprende habilidades tecnológicas de expertos en la industria a tu propio ritmo.
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 5 }}
        >
          <Button
            size="large"
            variant="contained"
            color="secondary"
            component={Link}
            to={ROUTES.COURSES}
          >
            Explorar Cursos
          </Button>
          {isAuthenticated ? (
            <Button
              size="large"
              variant="outlined"
              color="inherit"
              onClick={() => goToDashboard(user?.role)}
            >
              Ir al Dashboard
            </Button>
          ) : (
            <Button
              size="large"
              variant="outlined"
              color="inherit"
              component={Link}
              to={ROUTES.REGISTER}
            >
              Comenzar Ahora
            </Button>
          )}
        </Stack>

        {/* Estadísticas */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            bgcolor: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(4px)',
            borderRadius: 3
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={4}
            justifyContent="space-around"
            alignItems="center"
            textAlign="center"
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>+100</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Cursos Disponibles</Typography>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>+5000</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Estudiantes Activos</Typography>
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Certificados</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Validados por la Plataforma</Typography>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}

export default Hero
