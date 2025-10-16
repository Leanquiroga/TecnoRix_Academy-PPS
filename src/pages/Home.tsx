import { Container, Typography, Box, Button } from '@mui/material'

export default function Home() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box textAlign="center">
        <Typography variant="h3" component="h1" gutterBottom>
          {import.meta.env.VITE_APP_NAME || 'TecnoRix Academy'}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Plataforma E-Learning con React + Node.js + Supabase
        </Typography>
        <Button variant="contained" size="large" href="#">
          Empezar
        </Button>
      </Box>
    </Container>
  )
}
