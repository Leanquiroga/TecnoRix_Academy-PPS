import { useState, useEffect } from 'react'
import { Button, Container, TextField, Typography, Stack, Alert, Box, Link as MuiLink } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { login, loading, error, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

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
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>Iniciar sesión</Typography>
      <Stack component="form" spacing={2} onSubmit={onSubmit}>
        {localError && <Alert severity="error">{localError}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
        <TextField label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
        <Button type="submit" variant="contained" disabled={loading}>Entrar</Button>
        <Box textAlign="center">
          <Typography variant="body2">
            ¿No tienes cuenta?{' '}
            <MuiLink component={Link} to="/register">
              Regístrate aquí
            </MuiLink>
          </Typography>
        </Box>
      </Stack>
    </Container>
  )
}
