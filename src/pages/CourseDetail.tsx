import { useEffect, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
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
  Link,
} from '@mui/material'
import {
  ArrowBack,
  Person,
  AttachMoney,
  PictureAsPdf,
  PlayCircle,
  Link as LinkIcon,
} from '@mui/icons-material'
import type { CourseMaterial } from '../types/course'
import { VideoPlayer } from '../components/VideoPlayer'
import { PdfViewer } from '../components/PdfViewer'
import { useNavigation } from '../hooks/useNavigation'
import { useCourse } from '../hooks/useCourse'
import { EnrollButton } from '../components/EnrollButton'
import { useAuthStore } from '../store/auth.store'
import { useQuizStore } from '../store/quiz.store'
import QuizCard from '../components/quiz/QuizCard'

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
  const { goToCourses, goToCourseForum } = useNavigation()
  const { 
    currentCourse: course, 
    materials, 
    loading, 
    error, 
    fetchCourseById, 
    fetchCourseMaterials, 
    clearCurrentCourse 
  } = useCourse()
  
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null)
  const { user } = useAuthStore()
  const { loadQuizzesByCourse, quizzesByCourse } = useQuizStore()

  useEffect(() => {
    if (!id) {
      return
    }

    const loadCourseData = async () => {
      try {
        // Cargar datos básicos del curso primero
        await fetchCourseById(id)
      } catch (err) {
        console.error('Error al cargar curso:', err)
      }

      // No bloquear la carga de quizzes si fallan los materiales (por ejemplo, usuario no inscrito)
      fetchCourseMaterials(id).catch((err) => {
        console.warn('Materiales no disponibles o error al cargar materiales:', err)
      })

      // Cargar quizzes siempre, independientemente del estado de materiales
      try {
        await loadQuizzesByCourse(id)
      } catch (err) {
        console.error('Error al cargar quizzes del curso:', err)
      }
    }

    loadCourseData()

    // Cleanup al desmontar
    return () => {
      clearCurrentCourse()
    }
  }, [id, fetchCourseById, fetchCourseMaterials, clearCurrentCourse, loadQuizzesByCourse])

  // Seleccionar primer material cuando se cargan
  useEffect(() => {
    if (materials.length > 0 && !selectedMaterial) {
      setSelectedMaterial(materials[0])
    }
  }, [materials, selectedMaterial])

  const handleBack = () => {
    goToCourses()
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

  // Si no hay curso, mostramos error bloqueante; los errores de materiales no deben bloquear la vista del curso/quizzes
  if (!course) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {!error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {'Curso no encontrado'}
          </Alert>
        )}
        <Button startIcon={<ArrowBack />} onClick={handleBack}>
          Volver a cursos
        </Button>
      </Container>
    )
  }

  const quizzes = id ? quizzesByCourse[id] ?? [] : []

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

              <Stack spacing={1} alignItems="flex-end">
                <EnrollButton
                  courseId={course.id}
                  size="large"
                  sx={{ minWidth: 200 }}
                />
                {(user?.role === 'teacher' || user?.role === 'admin') && (
                  <Button variant="text" size="small" onClick={() => goToCourseForum(course.id)}>
                    Ir al Foro
                  </Button>
                )}
                {user?.role === 'teacher' && (
                  <Button
                    variant="outlined"
                    size="small"
                    component={RouterLink}
                    to={`/teacher/courses/${course.id}/quizzes/create`}
                  >
                    Crear Quiz
                  </Button>
                )}
              </Stack>
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

        {/* Right Column: Viewer + Quizzes */}
        <Box sx={{ flex: 1 }}>
          <Stack spacing={3}>
            <Box sx={{ minHeight: '400px' }}>{renderMaterialViewer()}</Box>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6">Quizzes del curso</Typography>
                {user?.role === 'teacher' && (
                  <Link component={RouterLink} to={`/teacher/courses/${course.id}/quizzes/create`} underline="hover">
                    Crear quiz
                  </Link>
                )}
              </Stack>
              {quizzes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Aún no hay quizzes.</Typography>
              ) : (
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: '1fr 1fr',
                    lg: '1fr 1fr 1fr'
                  },
                  gap: 2,
                }}>
                  {quizzes.map(q => (
                    <Box key={q.id}>
                      <QuizCard quiz={q} showProgressLink={user?.role === 'student'} />
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Stack>
        </Box>
      </Box>
    </Container>
  )
}

export default CourseDetail
