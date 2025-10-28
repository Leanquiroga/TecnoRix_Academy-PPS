import { useEffect, useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material'
import {
  School,
  TrendingUp,
  CheckCircle,
  PlayArrow,
  Explore,
} from '@mui/icons-material'
import { useEnrollmentStore } from '../store/enrollment.store'
import { enrollmentService } from '../api/enrollment.service'
import { useNavigation } from '../hooks/useNavigation'
import type { StudentStats } from '../types/enrollment'

export default function StudentDashboard() {
  const { myCourses, loading, error, fetchMyCourses } = useEnrollmentStore()
  const { goToCourseView, goToCourses, goToMyCourses } = useNavigation()
  
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyCourses()
  }, [fetchMyCourses])

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true)
        setStatsError(null)
        const data = await enrollmentService.getStudentStats()
        setStats(data)
      } catch (err: any) {
        setStatsError(err?.response?.data?.error || 'Error al cargar estadísticas')
      } finally {
        setLoadingStats(false)
      }
    }
    loadStats()
  }, [])

  const activeCourses = myCourses.filter((e) => e.status === 'active')
  const inProgressCourses = activeCourses.filter((e) => e.progress < 100).slice(0, 3)
  // Curso en progreso más reciente
  const lastInProgress = activeCourses
    .filter((e) => e.progress < 100)
    .sort((a, b) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime())[0]

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Botón continuar donde lo dejé */}
      <Box mb={2}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<PlayArrow />}
          disabled={!lastInProgress}
          onClick={() => lastInProgress && goToCourseView(lastInProgress.course_id)}
        >
          {lastInProgress
            ? `Continuar donde lo dejé: ${lastInProgress.course.title}`
            : 'No tienes cursos en progreso'}
        </Button>
      </Box>
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Mi Panel de Estudiante
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bienvenido a tu espacio de aprendizaje
        </Typography>
      </Box>

      {/* Estadísticas */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
        sx={{ mb: 4 }}
        flexWrap="wrap"
      >
        <Paper
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            height: 140,
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <School />
            <Typography variant="h6">Total Cursos</Typography>
          </Box>
          <Typography variant="h3" component="div" fontWeight="bold">
            {loadingStats ? <CircularProgress size={32} color="inherit" /> : stats?.total_courses ?? 0}
          </Typography>
          <Typography variant="body2" sx={{ mt: 'auto', opacity: 0.9 }}>
            Inscrito en total
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            height: 140,
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <PlayArrow />
            <Typography variant="h6">En Progreso</Typography>
          </Box>
          <Typography variant="h3" component="div" fontWeight="bold">
            {loadingStats ? <CircularProgress size={32} color="inherit" /> : stats?.active_courses ?? 0}
          </Typography>
          <Typography variant="body2" sx={{ mt: 'auto', opacity: 0.9 }}>
            Cursos activos
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            height: 140,
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <CheckCircle />
            <Typography variant="h6">Completados</Typography>
          </Box>
          <Typography variant="h3" component="div" fontWeight="bold">
            {loadingStats ? <CircularProgress size={32} color="inherit" /> : stats?.completed_courses ?? 0}
          </Typography>
          <Typography variant="body2" sx={{ mt: 'auto', opacity: 0.9 }}>
            Finalizados
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            height: 140,
            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' },
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <TrendingUp />
            <Typography variant="h6">Progreso Promedio</Typography>
          </Box>
          <Typography variant="h3" component="div" fontWeight="bold">
            {loadingStats ? <CircularProgress size={32} color="inherit" /> : `${Math.round(stats?.average_progress ?? 0)}%`}
          </Typography>
          <Typography variant="body2" sx={{ mt: 'auto', opacity: 0.9 }}>
            En todos los cursos
          </Typography>
        </Paper>
      </Stack>

      {statsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {statsError}
        </Alert>
      )}

      {/* Cursos en progreso */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Continúa tu aprendizaje
          </Typography>
          <Button variant="outlined" size="small" onClick={goToMyCourses}>
            Ver todos mis cursos
          </Button>
        </Stack>

        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && inProgressCourses.length === 0 && (
          <Alert severity="info">
            No tienes cursos en progreso. ¡Explora el catálogo para comenzar!
          </Alert>
        )}

        <Stack spacing={2}>
          {inProgressCourses.map((enrollment) => (
            <Card key={enrollment.id} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="h6" gutterBottom>
                      {enrollment.course.title}
                    </Typography>
                    <Stack direction="row" spacing={1} mb={2}>
                      {enrollment.course.level && (
                        <Chip size="small" label={enrollment.course.level} variant="outlined" />
                      )}
                      {enrollment.course.category && (
                        <Chip size="small" label={enrollment.course.category} variant="outlined" />
                      )}
                    </Stack>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Progreso
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {enrollment.progress}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={enrollment.progress}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PlayArrow />}
                  onClick={() => goToCourseView(enrollment.course_id)}
                >
                  Continuar
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      </Paper>

      {/* Acciones rápidas */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Acciones rápidas
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Explore />}
            onClick={goToCourses}
            fullWidth
          >
            Explorar más cursos
          </Button>
          <Button
            variant="outlined"
            startIcon={<School />}
            onClick={goToMyCourses}
            fullWidth
          >
            Ver todos mis cursos
          </Button>
        </Stack>
      </Paper>
    </Container>
  )
}
