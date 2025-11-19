import { Box, Typography, Stack, Chip, CircularProgress } from '@mui/material'
import type { User } from '../../types/auth'
import { useEffect, useState } from 'react'
import { getActivitySummary, type ActivitySummary } from '../../api/user.service'

interface Props { user: User }

export default function ActivitySummary({ user }: Props) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ActivitySummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const summary = await getActivitySummary()
        if (mounted) setData(summary)
      } catch (e: any) {
        if (mounted) setError(e.message || 'Error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user.role])

  return (
    <Box>
      <Typography variant="h6" mb={2}>Mi Actividad</Typography>
      {loading && (
        <Stack direction="row" alignItems="center" gap={1}><CircularProgress size={20} /><Typography variant="body2">Cargando resumen...</Typography></Stack>
      )}
      {error && <Typography color="error" variant="body2">{error}</Typography>}
      {!loading && data && data.role === 'student' && (
        <Stack gap={1}>
          <Typography variant="body2">Cursos inscritos: {data.totalEnrolled}</Typography>
          <Typography variant="body2">Progreso promedio: {data.averageProgress.toFixed(1)}%</Typography>
          <Typography variant="body2">Certificados: {data.certificates}</Typography>
        </Stack>
      )}
      {!loading && data && data.role === 'teacher' && (
        <Stack gap={1}>
          <Typography variant="body2">Cursos creados: {data.totalCourses}</Typography>
          <Typography variant="body2">Total estudiantes: {data.totalStudents}</Typography>
        </Stack>
      )}
      {!loading && data && data.role === 'admin' && (
        <Stack gap={1}>
          <Typography variant="body2">Usuarios totales: {data.totalUsers}</Typography>
          <Typography variant="body2">Cursos totales: {data.totalCourses}</Typography>
          <Typography variant="body2">Quizzes totales: {data.totalQuizzes}</Typography>
        </Stack>
      )}
      {!loading && !error && (
        <Chip label="Resumen dinámico" size="small" sx={{ mt: 2 }} />
      )}
    </Box>
  )
}
