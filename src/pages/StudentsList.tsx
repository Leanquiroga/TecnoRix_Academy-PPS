import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  LinearProgress,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Search, People, ArrowBack, School } from '@mui/icons-material'
import { enrollmentService } from '../api/enrollment.service'
import { getCoursePublicById } from '../api/course.service'
import type { EnrollmentWithStudent, EnrollmentStatus } from '../types/enrollment'
import { useNavigation } from '../hooks/useNavigation'

export default function StudentsList() {
  const { id: courseId } = useParams()
  const { goBack, goToCourse } = useNavigation()

  const [courseTitle, setCourseTitle] = useState<string>('')
  const [students, setStudents] = useState<EnrollmentWithStudent[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<EnrollmentStatus | 'all'>('all')

  useEffect(() => {
    const loadData = async () => {
      if (!courseId) return
      try {
        setLoading(true)
        setError(null)
        const [course, enrollments] = await Promise.all([
          getCoursePublicById(courseId),
          enrollmentService.getCourseStudents(courseId),
        ])
        setCourseTitle(course.title)
        setStudents(enrollments)
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Error al cargar estudiantes')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [courseId])

  const filtered = useMemo(() => {
    return students.filter((e) => {
      const matchesSearch = `${e.student.name ?? ''} ${e.student.email ?? ''}`.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'all' ? true : e.status === status
      return matchesSearch && matchesStatus
    })
  }, [students, search, status])

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={320}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" onClick={goBack} startIcon={<ArrowBack />}>Volver</Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Estudiantes del Curso
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <School fontSize="small" />
                <Typography variant="body2" color="text.secondary">{courseTitle}</Typography>
              </Stack>
            </Box>
            {courseId && (
              <Button variant="contained" startIcon={<School />} onClick={() => goToCourse(courseId)}>
                Ir al Curso
              </Button>
            )}
          </Stack>
        </Box>

        {/* Filtros */}
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel id="status-label">Estado</InputLabel>
              <Select
                labelId="status-label"
                label="Estado"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="pending_payment">Pendiente de pago</MenuItem>
                <MenuItem value="completed">Completado</MenuItem>
                <MenuItem value="cancelled">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Tabla */}
        <Paper sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Estudiante</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell align="center"><strong>Estado</strong></TableCell>
                  <TableCell><strong>Progreso</strong></TableCell>
                  <TableCell><strong>Inscrito</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell>{e.student.name ?? 'Sin nombre'}</TableCell>
                    <TableCell>{e.student.email ?? '-'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={e.status}
                        color={
                          e.status === 'active' ? 'info' :
                          e.status === 'completed' ? 'success' :
                          e.status === 'pending_payment' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      <Stack>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" color="text.secondary">{e.progress}%</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={e.progress} sx={{ height: 8, borderRadius: 1 }} />
                      </Stack>
                    </TableCell>
                    <TableCell>{new Date(e.enrolled_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Box py={4} textAlign="center">
                        <People sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">No se encontraron estudiantes con los filtros aplicados</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={goBack}>Volver</Button>
        </Box>
      </Stack>
    </Container>
  )
}
