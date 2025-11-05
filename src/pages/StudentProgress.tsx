import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { Box, Card, CardContent, CircularProgress, Divider, Link, Stack, Typography, Chip } from '@mui/material'
import { useQuizStore } from '../store/quiz.store'

const formatDate = (iso: string) => new Date(iso).toLocaleString()

const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
  const width = 300
  const height = 60
  if (values.length === 0) return null
  const max = 100
  const min = 0
  const stepX = values.length > 1 ? width / (values.length - 1) : width
  const points = values.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / (max - min)) * height
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" stroke="#1976d2" strokeWidth="2" points={points} />
    </svg>
  )
}

const StudentProgressPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>()
  const { listAttempts, loadQuiz, currentQuiz } = useQuizStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(() => [] as Awaited<ReturnType<typeof listAttempts>>)

  useEffect(() => {
    if (!quizId) return
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        await loadQuiz(quizId)
        const data = await listAttempts(quizId)
        setAttempts(data)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar progreso'
        setError(msg)
      } finally {
        setLoading(false)
      }
    })()
  }, [quizId, loadQuiz, listAttempts])

  const percentages = useMemo(() => attempts
    .map(a => (a.percentage ?? 0))
    .filter(v => typeof v === 'number') as number[], [attempts])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) return <Typography color="error">{error}</Typography>
  if (!quizId || !currentQuiz) return <Typography>No se encontró el quiz.</Typography>

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h5">Mi progreso</Typography>
          <Link component={RouterLink} to={`/quizzes/${quizId}`} underline="hover">Volver al quiz</Link>
        </Stack>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>{currentQuiz.title}</Typography>
        <Divider sx={{ mb: 2 }} />

        {attempts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Aún no realizaste intentos.</Typography>
        ) : (
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5 }}>Evolución de tu porcentaje</Typography>
              <Sparkline values={percentages} />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Intentos ({attempts.length})</Typography>
              <Stack spacing={1}>
                {attempts.map((a) => (
                  <Stack key={a.id} direction="row" spacing={2} alignItems="center">
                    <Typography sx={{ minWidth: 120 }} variant="body2">{formatDate(a.updated_at)}</Typography>
                    <Typography variant="body2">{a.score ?? 0}/{a.total_points ?? 0} ({a.percentage ?? 0}%)</Typography>
                    <Chip size="small" label={a.passed ? 'Aprobado' : 'Reprobado'} color={a.passed ? 'success' : 'default'} />
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

export default StudentProgressPage
