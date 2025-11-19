import { Container, Box, Typography, Paper } from '@mui/material'
import { School, Groups, AccessTime } from '@mui/icons-material'

const features = [
  {
    icon: <AccessTime fontSize="large" color="primary" />,
    title: 'Aprende a tu ritmo',
    description: 'Accede a tu contenido cuando quieras y repásalo las veces que necesites.'
  },
  {
    icon: <School fontSize="large" color="primary" />,
    title: 'Expertos certificados',
    description: 'Profesores calificados con experiencia real en la industria tecnológica.'
  },
  {
    icon: <Groups fontSize="large" color="primary" />,
    title: 'Comunidad activa',
    description: 'Foros y soporte para resolver dudas y colaborar con otros estudiantes.'
  }
]

export function Features() {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h2"
          sx={{ textAlign: 'center', fontWeight: 'bold', mb: 4 }}
        >
          ¿Por qué elegirnos?
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 4,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }
          }}
        >
          {features.map((f) => (
            <Paper
              key={f.title}
              elevation={3}
              sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <Box>{f.icon}</Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{f.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {f.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  )
}

export default Features
