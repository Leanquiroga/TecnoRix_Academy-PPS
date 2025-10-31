import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import { useEnrollmentStore } from '../store/enrollment.store'
import type { EnrollmentStatus } from '../types/enrollment'
import { useNavigation } from '../hooks/useNavigation'
import { Breadcrumbs } from '../components/navigation/Breadcrumbs'

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: 'En progreso',
  pending_payment: 'Pendiente de pago',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

export function MyCourses() {
  // Breadcrumbs jerárquicos: Dashboard > Mis Cursos
  const customBreadcrumbs = [
    { label: 'Dashboard', path: '/student/dashboard' },
    { label: 'Mis Cursos', path: '/student/my-courses' },
  ]
  const { myCourses, loading, error, setFilter, fetchMyCourses } = useEnrollmentStore()
  const { goToCourseView, goToCourses } = useNavigation()
  const [localFilter, setLocalFilter] = useState<'all' | EnrollmentStatus>('all')

  useEffect(() => {
    fetchMyCourses(localFilter === 'all' ? undefined : localFilter)
  }, [localFilter, fetchMyCourses])

  const courses = useMemo(() => myCourses, [myCourses])

  const handleFilter = (_: React.SyntheticEvent, value: 'all' | EnrollmentStatus) => {
    if (!value) return
    setLocalFilter(value)
    setFilter(value)
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Breadcrumbs customItems={customBreadcrumbs} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Mis Cursos</Typography>
        <Button onClick={goToCourses} variant="outlined">Explorar cursos</Button>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2">Filtrar:</Typography>
        <ToggleButtonGroup size="small" exclusive value={localFilter} onChange={handleFilter}>
          <ToggleButton value="all">Todos</ToggleButton>
          <ToggleButton value="active">En progreso</ToggleButton>
          <ToggleButton value="completed">Completados</ToggleButton>
          <ToggleButton value="pending_payment">Pendiente de pago</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {!loading && courses.length === 0 && !error && (
        <Alert severity="info">Todavía no estás inscripto en cursos. Explora el catálogo para comenzar.</Alert>
      )}

      <Stack spacing={2}>
        {courses.map((e) => (
          <Card key={e.id}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {e.course.title}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <Chip size="small" label={STATUS_LABELS[e.status]} color={e.status === 'completed' ? 'success' : e.status === 'pending_payment' ? 'warning' : 'default'} />
                    {e.course.level && <Chip size="small" variant="outlined" label={e.course.level} />}
                    {e.course.category && <Chip size="small" variant="outlined" label={e.course.category} />}
                  </Stack>
                  <LinearProgress variant="determinate" value={e.progress} sx={{ height: 8, borderRadius: 1 }} />
                  <Typography variant="caption" color="text.secondary">Progreso: {e.progress}%</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={() => goToCourseView(e.course_id)} disabled={e.status === 'pending_payment'}>
                    Continuar
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
            <CardActions>
              <Typography variant="body2" color="text.secondary">
                Inscripto el {new Date(e.enrolled_at).toLocaleDateString()}
              </Typography>
            </CardActions>
          </Card>
        ))}
      </Stack>
    </Container>
  )
}

export default MyCourses
