import { useState, useEffect } from 'react'
import { Button, Container, TextField, Typography, Stack, Alert, MenuItem, Select, InputLabel, FormControl, Box, Link as MuiLink } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNavigation } from '../hooks/useNavigation'
import { ROUTES } from '../routes/routes.config'
import type { Role } from '../types/auth'

export default function RegisterPage() {
  const { register, loading, error, isAuthenticated } = useAuth()
  const { goToDashboard } = useNavigation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('student')
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
      await register({ name, email, password, role })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrarse'
      setLocalError(msg)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>Crear cuenta</Typography>
      <Stack component="form" spacing={2} onSubmit={onSubmit}>
        {localError && <Alert severity="error">{localError}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
        <TextField label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
        <FormControl fullWidth>
          <InputLabel id="role-label">Rol</InputLabel>
          <Select labelId="role-label" value={role} label="Rol" onChange={(e) => setRole(e.target.value as Role)}>
            <MenuItem value="student">Estudiante</MenuItem>
            <MenuItem value="teacher">Profesor</MenuItem>
          </Select>
        </FormControl>
        <Button type="submit" variant="contained" disabled={loading}>Registrarse</Button>
        <Box textAlign="center">
          <Typography variant="body2">
            ¿Ya tienes cuenta?{' '}
            <MuiLink component={Link} to={ROUTES.LOGIN}>
              Inicia sesión aquí
            </MuiLink>
          </Typography>
        </Box>
      </Stack>
    </Container>
  )
}
