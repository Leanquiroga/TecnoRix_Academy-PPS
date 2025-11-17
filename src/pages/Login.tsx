import { useState, useEffect } from 'react'
import { Button, TextField, Typography, Stack, Alert, Box, Link as MuiLink, Card, CardContent } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNavigation } from '../hooks/useNavigation'
import { ROUTES } from '../routes/routes.config'

export default function LoginPage() {
  const { login, loading, error, isAuthenticated } = useAuth()
  const { goToDashboard } = useNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      goToDashboard()
    }
  }, [isAuthenticated, goToDashboard])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (!email || !password) {
      setLocalError('Email y contraseña son requeridos')
      return
    }
    try {
      await login({ email, password })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setLocalError(msg)
    }
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        width: '100%',
        flex: 1,
        px: 2
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 450 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">Iniciar sesión</Typography>
          <Stack component="form" spacing={2} onSubmit={onSubmit}>
            {localError && <Alert severity="error">{localError}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
            <Button type="submit" variant="contained" disabled={loading}>Entrar</Button>
            <Box textAlign="center">
              <Typography variant="body2">
                <MuiLink component={Link} to="/forgot-password">
                  ¿Olvidaste tu contraseña?
                </MuiLink>
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="body2">
                ¿No tienes cuenta?{' '}
                <MuiLink component={Link} to={ROUTES.REGISTER}>
                  Regístrate aquí
                </MuiLink>
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
