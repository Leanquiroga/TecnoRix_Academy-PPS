import { Box, Typography, TextField, Button, Stack, Alert } from '@mui/material'
import { useState } from 'react'
import { changePassword } from '../../api/auth.service'

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos los campos son obligatorios')
      return
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('La confirmación no coincide')
      return
    }
    if (currentPassword === newPassword) {
      setError('La nueva contraseña debe ser distinta a la actual')
      return
    }
    setLoading(true)
    try {
      const msg = await changePassword(currentPassword, newPassword)
      setSuccess(msg)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box maxWidth={480}>
      <Typography variant="h6" mb={2}>Seguridad</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Cambia tu contraseña. Mantén tu cuenta segura.</Typography>
      <Box component="form" onSubmit={onSubmit}>
        <Stack gap={2}>
          {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          <TextField label="Contraseña actual" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} disabled={loading} required />
          <TextField label="Nueva contraseña" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={loading} required />
          <TextField label="Confirmar nueva contraseña" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading} required />
          <Box>
            <Button type="submit" variant="contained" disabled={loading}>Guardar</Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}
