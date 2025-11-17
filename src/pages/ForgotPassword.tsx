// ============================================
// FORGOT PASSWORD PAGE - FASE 6.6
// ============================================
// Página para solicitar recuperación de contraseña

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Link as MuiLink,
} from '@mui/material'
import { ArrowBack as BackIcon } from '@mui/icons-material'
import { forgotPassword } from '../api/auth.service'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim()) {
      setError('Por favor ingresa tu email')
      return
    }

    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
    if (!emailRegex.test(email)) {
      setError('Email inválido')
      return
    }

    setLoading(true)
    try {
      const message = await forgotPassword(email)
      setSuccess(message)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar email de recuperación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Recuperar Contraseña
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            Ingresa tu email y te enviaremos un link para restablecer tu contraseña
          </Typography>

          <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && (
              <Alert severity="success">
                {success}
                <Typography variant="caption" display="block" mt={1}>
                  Revisa tu bandeja de entrada y spam.
                </Typography>
              </Alert>
            )}

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              disabled={loading || !!success}
              autoComplete="email"
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading || !!success}
              fullWidth
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperación'}
            </Button>

            <Box textAlign="center" mt={2}>
              <MuiLink
                component={Link}
                to="/login"
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
              >
                <BackIcon fontSize="small" />
                Volver al Login
              </MuiLink>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
