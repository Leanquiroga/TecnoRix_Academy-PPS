import { useState } from 'react'
import { Paper, Stack, TextField, Button, Typography } from '@mui/material'

interface Props {
  onSubmit: (data: { title: string; message: string }) => Promise<void> | void
  submitting?: boolean
}

export function ForumPostForm({ onSubmit, submitting }: Props) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({ title: title.trim(), message: message.trim() })
    setTitle('')
    setMessage('')
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }} component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" sx={{ mb: 2 }}>Crear nuevo post</Typography>
      <Stack spacing={2}>
        <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
        <TextField label="Mensaje" value={message} onChange={(e) => setMessage(e.target.value)} fullWidth multiline minRows={3} />
        <div>
          <Button type="submit" variant="contained" disabled={submitting || !title.trim() || !message.trim()}>
            Publicar
          </Button>
        </div>
      </Stack>
    </Paper>
  )
}

export default ForumPostForm
