import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stack,
} from '@mui/material'
import {
  ArrowBack,
  Person,
  AttachMoney,
  School,
  PictureAsPdf,
  PlayCircle,
  Link as LinkIcon,
} from '@mui/icons-material'
import { getCoursePublicById, getCourseMaterials } from '../api/course.service'
import type { CoursePublic, CourseMaterial } from '../types/course'
import { VideoPlayer } from '../components/VideoPlayer'
import { PdfViewer } from '../components/PdfViewer'

const levelColors = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'error',
} as const

const levelLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
} as const

export function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [course, setCourse] = useState<CoursePublic | null>(null)
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('ID de curso no válido')
      setLoading(false)
      return
    }

    const fetchCourseData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [courseData, materialsData] = await Promise.all([
          getCoursePublicById(id),
          getCourseMaterials(id),
        ])

        setCourse(courseData)
        setMaterials(materialsData)

        // Seleccionar primer material por defecto
        if (materialsData.length > 0) {
          setSelectedMaterial(materialsData[0])
        }
      } catch (err: unknown) {
        console.error('Error al cargar curso:', err)
        const message = err instanceof Error ? err.message : String(err)
        setError(message || 'Error al cargar el curso')
      } finally {
        setLoading(false)
      }
    }

    fetchCourseData()
  }, [id])

  const handleBack = () => {
    navigate('/courses')
  }

  const handleEnroll = () => {
    // TODO: Implementar inscripción en FASE 4
    alert('Funcionalidad de inscripción próximamente')
  }

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <PictureAsPdf />
      case 'video':
        return <PlayCircle />
      case 'link':
        return <LinkIcon />
      default:
        return <LinkIcon />
    }
  }

  const renderMaterialViewer = () => {
    if (!selectedMaterial) {
      return (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: 'grey.50',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Selecciona un material para visualizar
          </Typography>
        </Paper>
      )
    }

    switch (selectedMaterial.type) {
      case 'video':
        return <VideoPlayer url={selectedMaterial.url} title={selectedMaterial.title} />
      case 'pdf':
        return <PdfViewer url={selectedMaterial.url} title={selectedMaterial.title} />
      case 'link':
        return (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <LinkIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {selectedMaterial.title}
            </Typography>
            <Button
              variant="contained"
              href={selectedMaterial.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mt: 2 }}
            >
              Abrir enlace
            </Button>
          </Paper>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error || !course) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Curso no encontrado'}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={handleBack}>
          Volver a cursos
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Volver a cursos
        </Button>

        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {course.title}
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  {course.level && (
                    <Chip
                      label={levelLabels[course.level]}
                      color={levelColors[course.level]}
                      size="small"
                    />
                  )}
                  {course.category && (
                    <Chip label={course.category} variant="outlined" size="small" />
                  )}
                </Stack>

                <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                  {course.instructor_name && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {course.instructor_name}
                      </Typography>
                    </Box>
                  )}

                  <Box display="flex" alignItems="center" gap={1}>
                    <AttachMoney fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {course.price === 0 || course.price === null
                        ? 'Gratis'
                        : `ARS ${course.price.toLocaleString('es-AR')}`}
                    </Typography>
                  </Box>
                </Stack>

                <Typography variant="body1" color="text.secondary" paragraph>
                  {course.description}
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                startIcon={<School />}
                onClick={handleEnroll}
                sx={{ minWidth: 200 }}
              >
                Inscribirse
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Content Area */}
      <Box display="flex" gap={3}>
        {/* Materials List */}
        <Paper sx={{ width: 300, flexShrink: 0 }}>
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6">Contenido del curso</Typography>
            <Typography variant="caption">
              {materials.length} {materials.length === 1 ? 'material' : 'materiales'}
            </Typography>
          </Box>
          <Divider />

          {materials.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay materiales disponibles
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {materials.map((material, index) => (
                <Box key={material.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={selectedMaterial?.id === material.id}
                      onClick={() => setSelectedMaterial(material)}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          '&:hover': {
                            bgcolor: 'primary.main',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color:
                            selectedMaterial?.id === material.id ? 'primary.contrastText' : 'action',
                        }}
                      >
                        {getMaterialIcon(material.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={material.title}
                        secondary={material.type.toUpperCase()}
                        secondaryTypographyProps={{
                          sx: {
                            color:
                              selectedMaterial?.id === material.id
                                ? 'primary.contrastText'
                                : 'text.secondary',
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < materials.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </Paper>

        {/* Material Viewer */}
        <Box sx={{ flex: 1, minHeight: '600px' }}>{renderMaterialViewer()}</Box>
      </Box>
    </Container>
  )
}

export default CourseDetail
