import { useEffect, useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import {
  Add,
  People,
  School,
  Pending,
  CheckCircle,
  BarChart,
} from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'
import { useNavigation } from '../hooks/useNavigation'
import { ROUTES } from '../routes/routes.config'
import { listPublicCourses } from '../api/course.service'
import { enrollmentService } from '../api/enrollment.service'
import type { Course } from '../types/course'

interface TeacherStats {
  totalCourses: number
  activeCourses: number
  pendingCourses: number
  totalStudents: number
}

interface CourseWithStudents extends Course {
  studentCount: number
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { goToCreateCourse, goToCourses, goToCourse, goTo } = useNavigation()
  
  const [courses, setCourses] = useState<CourseWithStudents[]>([])
  const [stats, setStats] = useState<TeacherStats>({
    totalCourses: 0,
    activeCourses: 0,
    pendingCourses: 0,
    totalStudents: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTeacherData()
  }, [])

  const loadTeacherData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Obtener todos los cursos
      const allCourses = await listPublicCourses()
      
      // Filtrar cursos del profesor actual
      const teacherCourses = allCourses.filter(
        (course: any) => course.teacher_id === user?.id
      )

      // Calcular estadísticas
      const activeCourses = teacherCourses.filter(
        (course: any) => course.status === 'approved'
      ).length
      const pendingCourses = teacherCourses.filter(
        (course: any) => course.status === 'pending_approval'
      ).length

      // Para cada curso, obtener el conteo de estudiantes
      const coursesWithStudents: CourseWithStudents[] = await Promise.all(
        teacherCourses.map(async (course: any) => {
          try {
            // Intentar obtener estudiantes, si falla usar 0
              const students = await enrollmentService.getCourseStudents(course.id)
            return {
              ...course,
              studentCount: students.length,
            }
          } catch {
            return {
              ...course,
              studentCount: 0,
            }
          }
        })
      )

      // Calcular total de estudiantes
      const totalStudents = coursesWithStudents.reduce(
        (sum, course) => sum + course.studentCount,
        0
      )

      setCourses(coursesWithStudents)
      setStats({
        totalCourses: teacherCourses.length,
        activeCourses,
        pendingCourses,
        totalStudents,
      })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al cargar datos del profesor')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadTeacherData}>
          Reintentar
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Panel del Profesor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona tus cursos y estudiantes
          </Typography>
        </Box>

        {/* Estadísticas */}
        <Stack
          direction="row"
          spacing={3}
          sx={{
            flexWrap: 'wrap',
            '& > *': {
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
            },
          }}
        >
          {/* Total Cursos */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalCourses}
                </Typography>
                <Typography variant="body2">Total Cursos</Typography>
              </Box>
              <School sx={{ fontSize: 48, opacity: 0.8 }} />
            </Stack>
          </Paper>

          {/* Cursos Activos */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {stats.activeCourses}
                </Typography>
                <Typography variant="body2">Activos</Typography>
              </Box>
              <CheckCircle sx={{ fontSize: 48, opacity: 0.8 }} />
            </Stack>
          </Paper>

          {/* Cursos Pendientes */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {stats.pendingCourses}
                </Typography>
                <Typography variant="body2">Pendientes</Typography>
              </Box>
              <Pending sx={{ fontSize: 48, opacity: 0.8 }} />
            </Stack>
          </Paper>

          {/* Total Estudiantes */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalStudents}
                </Typography>
                <Typography variant="body2">Total Estudiantes</Typography>
              </Box>
              <People sx={{ fontSize: 48, opacity: 0.8 }} />
            </Stack>
          </Paper>
        </Stack>

        {/* Acciones Rápidas */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Acciones Rápidas
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={goToCreateCourse}
              size="large"
            >
              Crear Nuevo Curso
            </Button>
            <Button
              variant="outlined"
              startIcon={<BarChart />}
              onClick={goToCourses}
              size="large"
            >
              Ver Todos los Cursos
            </Button>
          </Stack>
        </Paper>

        {/* Lista de Cursos */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Mis Cursos
          </Typography>
          
          {courses.length === 0 ? (
            <Box py={4} textAlign="center">
              <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tienes cursos creados
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Comienza creando tu primer curso para compartir tu conocimiento
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={goToCreateCourse}
              >
                Crear Curso
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Curso</strong></TableCell>
                    <TableCell><strong>Categoría</strong></TableCell>
                    <TableCell align="center"><strong>Estado</strong></TableCell>
                    <TableCell align="center"><strong>Estudiantes</strong></TableCell>
                    <TableCell align="center"><strong>Tipo</strong></TableCell>
                    <TableCell align="right"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {course.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {course.description.substring(0, 60)}
                          {course.description.length > 60 ? '...' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>{course.category}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={course.status}
                          color={
                              course.status === 'approved'
                              ? 'success'
                                : course.status === 'pending_approval'
                              ? 'warning'
                              : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<People />}
                          label={course.studentCount}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                            label={course.price === 0 ? 'Gratis' : 'Pago'}
                            color={course.price === 0 ? 'success' : 'primary'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => goToCourse(course.id)}
                          >
                            Ver Detalles
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => goTo(ROUTES.TEACHER.STUDENTS_BY_COURSE(course.id))}
                          >
                            Ver Estudiantes
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Stack>
    </Container>
  )
}
