import { useState, useEffect } from 'react'
import { Button, TextField, Typography, Stack, Alert, Box, Link as MuiLink, Card, CardContent } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNavigation } from '../hooks/useNavigation'
import { ROUTES } from '../routes/routes.config'

export default function RegisterPage() {
  const { register, loading, error, isAuthenticated } = useAuth()
  const { goToDashboard } = useNavigation()
  const [name, setName] = useState('')
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
    if (!name || !email || !password) {
      setLocalError('Todos los campos son requeridos')
      return
    }
    try {
      await register({ name, email, password, role: 'student' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrarse'
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
          <Typography variant="h4" gutterBottom align="center">Crear cuenta</Typography>
          <Stack component="form" spacing={2} onSubmit={onSubmit}>
            {localError && <Alert severity="error">{localError}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
            <Button type="submit" variant="contained" disabled={loading}>Registrarse</Button>
            <Box textAlign="center">
              <Typography variant="body2">
                ¿Ya tienes cuenta?{' '}
                <MuiLink component={Link} to={ROUTES.LOGIN}>
                  Inicia sesión aquí
                </MuiLink>
              </Typography>
            </Box>
            <Box textAlign="center" sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                ¿Eres profesor?{' '}
                <MuiLink component={Link} to="/register/teacher">
                  Regístrate aquí como docente
                </MuiLink>
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
