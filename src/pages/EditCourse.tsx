import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { getCoursePublicById, getCourseMaterials, updateCourse } from '../api/course.service'
import type { CoursePublic, CourseMaterial, CourseLevel } from '../types/course'

export function EditCourse() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [course, setCourse] = useState<CoursePublic | null>(null)
  const [materials, setMaterials] = useState<CourseMaterial[]>([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState<CourseLevel | ''>('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  useEffect(() => {
    if (!id) {
      setError('ID de curso no válido')
      setLoading(false)
      return
    }

    loadCourse()
  }, [id])

  const loadCourse = async () => {
    try {
      setLoading(true)
      setError(null)

      const [courseData, materialsData] = await Promise.all([
        getCoursePublicById(id!),
        getCourseMaterials(id!),
      ])

      setCourse(courseData)
      setMaterials(materialsData)

      // Prellenar formulario
      setTitle(courseData.title)
      setDescription(courseData.description)
      setPrice(courseData.price || 0)
      setCategory(courseData.category || '')
      setLevel((courseData.level as CourseLevel) || '')
      setThumbnailUrl(courseData.thumbnail_url || '')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message || 'Error al cargar el curso')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!title.trim() || !description.trim()) {
      setError('El título y la descripción son obligatorios')
      return
    }

    try {
      setSaving(true)

      await updateCourse(id!, {
        title: title.trim(),
        description: description.trim(),
        price: price || 0,
        category: category.trim() || undefined,
        level: level || undefined,
        thumbnail_url: thumbnailUrl.trim() || undefined,
      })

      setSuccess('Curso actualizado correctamente')
      setTimeout(() => {
        navigate('/teacher/courses')
      }, 2000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message || 'Error al actualizar el curso')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/teacher/courses')
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error && !course) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={handleCancel}>
          Volver
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={handleCancel} sx={{ mb: 2 }}>
        Volver a mis cursos
      </Button>

      <Typography variant="h4" component="h1" gutterBottom>
        Editar Curso
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Título del curso"
            fullWidth
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
          />

          <TextField
            label="Descripción"
            fullWidth
            required
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
          />

          <TextField
            label="Precio (ARS)"
            type="number"
            fullWidth
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            disabled={saving}
            inputProps={{ min: 0 }}
          />

          <TextField
            label="Categoría"
            fullWidth
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={saving}
            placeholder="Ej: Programación, Diseño, Marketing"
          />

          <FormControl fullWidth>
            <InputLabel id="level-label">Nivel</InputLabel>
            <Select
              labelId="level-label"
              value={level}
              label="Nivel"
              onChange={(e) => setLevel(e.target.value as CourseLevel)}
              disabled={saving}
            >
              <MenuItem value="">Sin especificar</MenuItem>
              <MenuItem value="beginner">Principiante</MenuItem>
              <MenuItem value="intermediate">Intermedio</MenuItem>
              <MenuItem value="advanced">Avanzado</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="URL de imagen de portada"
            fullWidth
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            disabled={saving}
            placeholder="https://..."
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Materiales del curso
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Los materiales no se pueden editar desde aquí. Para modificarlos, contacta al administrador.
            </Typography>
            {materials.length === 0 ? (
              <Alert severity="info">No hay materiales asociados a este curso.</Alert>
            ) : (
              <List>
                {materials.map((material) => (
                  <ListItem key={material.id} divider>
                    <ListItemText
                      primary={material.title}
                      secondary={`Tipo: ${material.type.toUpperCase()}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Guardar cambios'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  )
}

export default EditCourse
