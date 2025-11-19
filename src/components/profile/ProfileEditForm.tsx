import { useState } from 'react'
import { Box, TextField, Button, Stack, Alert } from '@mui/material'
import type { User } from '../../types/auth'
import { updateProfile } from '../../api/user.service'
import { useAuthStore } from '../../store/auth.store'

interface Props {
  user: User
}

export default function ProfileEditForm({ user }: Props) {
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio || '')
  const [country, setCountry] = useState(user.country || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(undefined)
    try {
      if (name.trim().length < 2) {
        setError('El nombre debe tener al menos 2 caracteres')
        return
      }
      if (bio.length > 500) {
        setError('La bio supera el máximo de 500 caracteres')
        return
      }
      const updated = await updateProfile({ name: name.trim(), bio: bio.trim() ? bio : null, country: country.trim() ? country : null })
      // Actualizar estado global de forma segura (Zustand setState)
      useAuthStore.setState(prev => ({ ...prev, user: { ...prev.user!, ...updated } }))
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box component="form" onSubmit={onSubmit} maxWidth={600}>
      <Stack gap={2}>
        {success && <Alert severity="success" onClose={() => setSuccess(false)}>Perfil actualizado</Alert>}
        {error && <Alert severity="error" onClose={() => setError(undefined)}>{error}</Alert>}
        <TextField label="Nombre" value={name} onChange={e => setName(e.target.value)} required disabled={saving} />
        <TextField label="Biografía" value={bio} onChange={e => setBio(e.target.value)} multiline minRows={3} disabled={saving} />
        <TextField label="País" value={country} onChange={e => setCountry(e.target.value)} disabled={saving} />
        <Box>
          <Button type="submit" variant="contained" disabled={saving}>Guardar Cambios</Button>
        </Box>
      </Stack>
    </Box>
  )
}
