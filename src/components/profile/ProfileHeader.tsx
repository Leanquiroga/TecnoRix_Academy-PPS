import { Box, Avatar, Typography, Stack, Chip, IconButton, Tooltip, CircularProgress } from '@mui/material'
import type { User } from '../../types/auth'
import { useState, useRef } from 'react'
import { uploadFile } from '../../api/upload.service'
import { updateProfile } from '../../api/user.service'
import { useAuthStore } from '../../store/auth.store'
import EditIcon from '@mui/icons-material/Edit'

interface Props { user: User }

export default function ProfileHeader({ user }: Props) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function handleSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Validaciones básicas
    if (!file.type.startsWith('image/')) {
      alert('Sólo imágenes (JPG, PNG, etc.)')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Máx 2MB')
      return
    }
    setUploading(true)
    try {
      const uploaded = await uploadFile(file)
      const updated = await updateProfile({ avatar_url: uploaded.url })
      useAuthStore.setState(prev => ({ ...prev, user: { ...prev.user!, ...updated } }))
    } catch (err: any) {
      alert(err.message || 'Error subiendo avatar')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function triggerSelect() {
    fileInputRef.current?.click()
  }
  return (
    <Box display="flex" gap={3} alignItems="center" mb={4}>
      <Avatar src={user.avatar_url} alt={user.name} sx={{ width: 96, height: 96, fontSize: 32 }}>
        {user.name?.[0] || 'U'}
      </Avatar>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleSelectFile} />
      <Stack gap={1}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="h5" fontWeight={600}>{user.name}</Typography>
          <Chip label={user.role} size="small" color={user.role === 'admin' ? 'error' : user.role === 'teacher' ? 'primary' : 'default'} />
          {user.verified_at && <Chip label="Verificado" size="small" color="success" />}
          <Tooltip title="Cambiar avatar">
            <span>
              <IconButton size="small" onClick={triggerSelect} disabled={uploading}>
                {uploading ? <CircularProgress size={18} /> : <EditIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        <Typography variant="body2" color="text.secondary">{user.email}</Typography>
        <Typography variant="body2" color="text.secondary">Miembro desde: {new Date(user.created_at).toLocaleDateString()}</Typography>
        {user.last_login && (
          <Typography variant="body2" color="text.secondary">Último acceso: {new Date(user.last_login).toLocaleString()}</Typography>
        )}
      </Stack>
    </Box>
  )
}
