import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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
  LinearProgress,
} from '@mui/material'
import {
  ArrowBack,
  CheckCircle,
  PictureAsPdf,
  PlayCircle,
  Link as LinkIcon,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material'
import type { CourseMaterial } from '../types/course'
import { VideoPlayer } from '../components/VideoPlayer'
import { PdfViewer } from '../components/PdfViewer'
import { useNavigation } from '../hooks/useNavigation'
import { useCourse } from '../hooks/useCourse'
import { useEnrollmentStore } from '../store/enrollment.store'
import { enrollmentService } from '../api/enrollment.service'
import { useNotify } from '../hooks/useNotify'
import { Breadcrumbs } from '../components/navigation/Breadcrumbs'

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

export function CourseView() {
  // Breadcrumbs jerárquicos: Dashboard > Mis Cursos > [Nombre del Curso]
  const { id } = useParams<{ id: string }>()
  const { goToMyCourses } = useNavigation()
  const { 
    currentCourse: course, 
    materials, 
    loading: courseLoading, 
    error: courseError, 
    fetchCourseById, 
    fetchCourseMaterials, 
    clearCurrentCourse 
  } = useCourse()
  const { myCourses } = useEnrollmentStore()
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [updatingProgress, setUpdatingProgress] = useState(false)
  const [progressError, setProgressError] = useState<string | null>(null)
  const notify = useNotify()
  const customBreadcrumbs = [
    { label: 'Dashboard', path: '/student/dashboard' },
    { label: 'Mis Cursos', path: '/student/my-courses' },
  ] as { label: string; path?: string }[]
  if (course) {
    customBreadcrumbs.push({ label: course.title })
  }

  useEffect(() => {
    if (!id) {
      return
    }

    const loadCourseData = async () => {
      try {
        await Promise.all([
          fetchCourseById(id),
          fetchCourseMaterials(id),
        ])
      } catch (err) {
        console.error('Error al cargar curso:', err)
      }
    }

    loadCourseData()

    return () => {
      clearCurrentCourse()
    }
  }, [id, fetchCourseById, fetchCourseMaterials, clearCurrentCourse])

  // Encontrar la inscripción del curso actual
  useEffect(() => {
    if (id && myCourses.length > 0) {
      const found = myCourses.find((e) => e.course_id === id)
      setEnrollment(found || null)
    }
  }, [id, myCourses])

  // Seleccionar primer material cuando se cargan
  useEffect(() => {
    if (materials.length > 0 && !selectedMaterial) {
      setSelectedMaterial(materials[0])
    }
  }, [materials, selectedMaterial])

  const handleBack = () => {
    goToMyCourses()
  }

  const handleMarkComplete = async () => {
    if (!enrollment) return
    try {
      setUpdatingProgress(true)
      setProgressError(null)
  await enrollmentService.updateProgress(enrollment.id, 100)
      // Actualizar enrollment local
      setEnrollment({ ...enrollment, progress: 100, status: 'completed' })
  notify({ title: 'Curso completado', message: '¡Buen trabajo! 🎉', severity: 'success' })
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'No se pudo actualizar el progreso'
      setProgressError(msg)
    } finally {
      setUpdatingProgress(false)
    }
  }

  const handleUpdateProgress = async (newProgress: number) => {
    if (!enrollment) return
    try {
      setUpdatingProgress(true)
      setProgressError(null)
      await enrollmentService.updateProgress(enrollment.id, newProgress)
      setEnrollment({ ...enrollment, progress: newProgress })
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'No se pudo actualizar el progreso'
      setProgressError(msg)
    } finally {
      setUpdatingProgress(false)
    }
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

  const getCurrentMaterialIndex = () => {
    if (!selectedMaterial) return -1
    return materials.findIndex((m) => m.id === selectedMaterial.id)
  }

  const handlePreviousMaterial = () => {
    const currentIndex = getCurrentMaterialIndex()
    if (currentIndex > 0) {
      setSelectedMaterial(materials[currentIndex - 1])
    }
  }

  const handleNextMaterial = () => {
    const currentIndex = getCurrentMaterialIndex()
    if (currentIndex >= 0 && currentIndex < materials.length - 1) {
      setSelectedMaterial(materials[currentIndex + 1])
    }
  }

  if (courseLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (courseError || !course) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {courseError || 'Curso no encontrado'}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={handleBack}>
          Volver a Mis Cursos
        </Button>
      </Container>
    )
  }

  // Verificar si el estudiante está inscrito
  if (!enrollment) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          No estás inscrito en este curso.
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={handleBack}>
          Volver a Mis Cursos
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Breadcrumbs customItems={customBreadcrumbs} />
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Volver a Mis Cursos
        </Button>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Box>
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
                  {enrollment.status === 'completed' && (
                    <Chip
                      icon={<CheckCircle />}
                      label="Completado"
                      color="success"
                      size="small"
                    />
                  )}
                </Stack>

                <Typography variant="body1" color="text.secondary" paragraph>
                  {course.description}
                </Typography>
              </Box>

              {/* Progress Section */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Progreso del curso
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {enrollment.progress}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={enrollment.progress}
                  sx={{ height: 10, borderRadius: 1, mb: 2 }}
                />
                <Stack direction="row" spacing={2}>
                  {enrollment.progress < 100 && (
                    <>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleUpdateProgress(Math.min(enrollment.progress + 10, 100))}
                        disabled={updatingProgress}
                      >
                        +10% Progreso
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={handleMarkComplete}
                        disabled={updatingProgress}
                      >
                        Marcar como completado
                      </Button>
                    </>
                  )}
                </Stack>
                {progressError && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {progressError}
                  </Alert>
                )}
              </Box>
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
        <Box sx={{ flex: 1, minHeight: '600px' }}>
          {renderMaterialViewer()}
          
          {/* Navigation Buttons */}
          {selectedMaterial && materials.length > 1 && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<NavigateBefore />}
                onClick={handlePreviousMaterial}
                disabled={getCurrentMaterialIndex() === 0}
              >
                Anterior
              </Button>

              <Typography variant="body2" color="text.secondary">
                Material {getCurrentMaterialIndex() + 1} de {materials.length}
              </Typography>

              <Button
                variant="outlined"
                endIcon={<NavigateNext />}
                onClick={handleNextMaterial}
                disabled={getCurrentMaterialIndex() === materials.length - 1}
              >
                Siguiente
              </Button>
            </Stack>
          )}
        </Box>
      </Box>
    </Container>
  )
}

export default CourseView
