import { Box, Paper, Container, Typography, Button, Stack } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Hero from '../components/home/Hero'
import Features from '../components/home/Features'
import FeaturedCourses from '../components/home/FeaturedCourses'

export default function Home() {
  // isAuthenticated ya no se usa en CTA (botón secundario removido)
  // Se mantiene hook por si futuras secciones requieren estado de auth
  useAuth()

  return (
    <Box>
      <Hero />
      <Features />
      <FeaturedCourses />

      {/* Teacher CTA Section */}
      <Box component="section" sx={{ py: { xs: 6, md: 8 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="md">
          <Paper elevation={4} sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', borderRadius: 4 }}>
            <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
              ¿Eres experto en tu campo?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Comparte tu conocimiento y ayuda a cientos de estudiantes a aprender habilidades tecnológicas.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                color="primary"
                size="large"
                component={Link}
                to="/register/teacher"
              >
                Convertirse en Profesor
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* Footer ahora provisto por LandingLayout */}
    </Box>
  )
}
