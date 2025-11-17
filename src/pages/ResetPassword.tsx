// ============================================
// RESET PASSWORD PAGE - FASE 6.6
// ============================================
// Página para restablecer contraseña con token

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
} from '@mui/material'
import { resetPassword } from '../api/auth.service'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    // Extraer token de la URL (viene como hash fragment de Supabase)
    const tokenFromQuery = searchParams.get('access_token')
    const hashToken = window.location.hash.match(/access_token=([^&]+)/)
    
    const extractedToken = tokenFromQuery || (hashToken ? hashToken[1] : null)
    
    if (!extractedToken) {
      setError('Token de recuperación no encontrado o inválido')
    } else {
      setAccessToken(extractedToken)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!accessToken) {
      setError('Token no válido')
      return
    }

    if (!newPassword || !confirmPassword) {
      setError('Por favor completa ambos campos')
      return
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      await resetPassword(accessToken, newPassword)
      setSuccess(true)
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
            <Alert severity="success">
              <Typography variant="h6" gutterBottom>
                ¡Contraseña actualizada!
              </Typography>
              <Typography variant="body2">
                Tu contraseña ha sido restablecida exitosamente. 
                Serás redirigido al login en unos segundos...
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    )
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
            Nueva Contraseña
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            Ingresa tu nueva contraseña
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            <TextField
              label="Nueva Contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              disabled={loading || !accessToken}
              autoComplete="new-password"
            />

            <TextField
              label="Confirmar Contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              disabled={loading || !accessToken}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading || !accessToken}
              fullWidth
            >
              {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
