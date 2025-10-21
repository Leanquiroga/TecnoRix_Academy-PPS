import { useState } from 'react'
import { Box, Button, Container, TextField, Typography, Chip, Stack, Paper, IconButton, Divider } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { useFileUpload } from '../hooks/useFileUpload'
import { createCourse } from '../api/course.service'
import type { CourseCreateInput, CourseMaterialInput, CourseMaterialType } from '../types/course'

export default function CreateCoursePage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [materials, setMaterials] = useState<CourseMaterialInput[]>([])
  const [submitting, setSubmitting] = useState(false)

  const { uploading, error: uploadError, upload } = useFileUpload()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const uploaded = await upload(file)
    if (!uploaded) return

    const type: CourseMaterialType = file.type === 'application/pdf' ? 'pdf' : 'video'
    const item: CourseMaterialInput = {
      title: file.name,
      type,
      url: uploaded.url,
      order: materials.length + 1,
    }
    setMaterials((prev) => [...prev, item])
    // Reset input value to allow re-uploading same file name
    e.currentTarget.value = ''
  }

  const removeMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload: CourseCreateInput = {
        title: title.trim(),
        description: description.trim(),
        price: typeof price === 'number' ? price : undefined,
        materials,
      }
      await createCourse(payload)
      // Simple feedback: reset form
      setTitle('')
      setDescription('')
      setPrice('')
      setMaterials([])
      alert('Curso creado y enviado para aprobación')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear curso'
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Crear curso
      </Typography>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <Box>
            <TextField
              label="Título"
              fullWidth
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Box>
          <Box>
            <TextField
              label="Descripción"
              fullWidth
              required
              multiline
              minRows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Box>
          <Box>
            <TextField
              label="Precio (opcional)"
              fullWidth
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </Box>
          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
                disabled={uploading}
              >
                {uploading ? 'Subiendo…' : 'Agregar material (PDF/Video)'}
                <input hidden type="file" onChange={handleFileSelect} accept="application/pdf,video/*" />
              </Button>
              {uploadError && <Chip color="error" label={uploadError} />}
            </Stack>
          </Box>
          <Box>
            <Typography variant="h6" gutterBottom>
              Materiales ({materials.length})
            </Typography>
            <Stack spacing={1}>
              {materials.map((m, idx) => (
                <Paper key={`${m.url}-${idx}`} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {m.type === 'pdf' ? (
                      <PictureAsPdfIcon color="action" />
                    ) : (
                      <PlayCircleOutlineIcon color="action" />
                    )}
                    <Typography sx={{ flex: 1 }} noWrap title={m.title}>
                      {idx + 1}. {m.title}
                    </Typography>
                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    <IconButton aria-label="eliminar" onClick={() => removeMaterial(idx)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Paper>
              ))}
              {materials.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No hay materiales cargados aún.
                </Typography>
              )}
            </Stack>
          </Box>
          <Box>
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={submitting || !title || !description}>
                {submitting ? 'Creando…' : 'Crear curso'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                disabled={submitting}
                onClick={() => {
                  setTitle('')
                  setDescription('')
                  setPrice('')
                  setMaterials([])
                }}
              >
                Limpiar
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Container>
  )
}
