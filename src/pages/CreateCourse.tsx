import { useState } from 'react'
import { Box, Container, TextField, Typography, Stack, Paper, IconButton, Divider, Button, Alert } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { useFileUpload } from '../hooks/useFileUpload'
import { useNotify } from '../hooks/useNotify'
import { createCourse } from '../api/course.service'
import FileUploadZone from '../components/common/FileUploadZone'
import type { CourseCreateInput, CourseMaterialInput, CourseMaterialType } from '../types/course'
import { uploadFile } from '../api/upload.service'
import { CourseThumbnail } from '../components/CourseThumbnail'

export default function CreateCoursePage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [materials, setMaterials] = useState<CourseMaterialInput[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbUploading, setThumbUploading] = useState(false)
  const [thumbError, setThumbError] = useState<string | null>(null)

  const { uploading, error: uploadError, upload } = useFileUpload()
  const notify = useNotify()

  const handleFileUpload = async (file: File) => {
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
        thumbnail_url: thumbnailUrl.trim() || undefined,
        materials,
      }
      await createCourse(payload)
      // Simple feedback: reset form
      setTitle('')
      setDescription('')
      setPrice('')
      setMaterials([])
      setThumbnailUrl('')
      notify({
        title: 'Curso creado',
        message: 'Tu curso fue enviado para aprobación',
        severity: 'success',
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear curso'
      notify({ message: msg, severity: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleThumbnailFile = async (file: File | undefined) => {
    if (!file) return
    setThumbError(null)
    if (file.size > 3 * 1024 * 1024) {
      setThumbError('La imagen excede 3MB')
      return
    }
    setThumbUploading(true)
    try {
      const res = await uploadFile(file)
      setThumbnailUrl(res.url)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir imagen'
      setThumbError(msg)
    } finally {
      setThumbUploading(false)
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
          {/* Portada */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="h6" gutterBottom>Portada del curso</Typography>
              
              {/* Vista previa de la portada */}
              <Box 
                sx={{ 
                  position: 'relative',
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider'
                }} 
                aria-busy={thumbUploading}
              >
                {thumbUploading && (
                  <Box
                    sx={{
                      position: 'absolute', 
                      inset: 0,
                      bgcolor: 'rgba(0, 0, 0, 0.7)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'common.white', 
                      fontSize: 14, 
                      zIndex: 1
                    }}
                  >
                    Subiendo imagen…
                  </Box>
                )}
                <CourseThumbnail url={thumbnailUrl} title={title || 'Curso'} height={200} />
              </Box>

              {/* Controles de portada */}
              <Stack spacing={1.5}>
                <TextField
                  label="URL de portada"
                  fullWidth
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={thumbUploading}
                  size="small"
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    component="label"
                    disabled={thumbUploading}
                    size="small"
                  >
                    {thumbUploading ? 'Subiendo…' : 'SUBIR IMAGEN'}
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleThumbnailFile(e.target.files?.[0])}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    disabled={thumbUploading || !thumbnailUrl}
                    onClick={() => setThumbnailUrl('')}
                    size="small"
                  >
                    QUITAR PORTADA
                  </Button>
                </Stack>
                {thumbError && <Alert severity="error" onClose={() => setThumbError(null)}>{thumbError}</Alert>}
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                  Recomendado: JPG/PNG 16:9 &lt; 3MB. Puedes pegar una URL externa o subir un archivo. Si no agregas portada se mostrará "Sin portada".
                </Typography>
              </Stack>
            </Stack>
          </Paper>
          <Box>
            <Typography variant="h6" gutterBottom>
              Materiales del curso
            </Typography>
            <FileUploadZone
              onUpload={handleFileUpload}
              loading={uploading}
              error={uploadError}
              accept="application/pdf,video/*"
              maxSize={100 * 1024 * 1024}
              showPreview={true}
              helperText="Acepta archivos PDF y videos (MP4, WebM, etc.) hasta 100MB"
            />
          </Box>
          {materials.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Materiales agregados ({materials.length})
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
              </Stack>
            </Box>
          )}
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
                  setThumbnailUrl('')
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
