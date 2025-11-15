import React, { useEffect, useMemo } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { Box, Card, CardContent, CircularProgress, Divider, Link, Typography, Chip, Stack, LinearProgress, Button, Alert } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { useQuizStore } from '../store/quiz.store'
import type { QuizAttemptWithDetails } from '../types/quiz.types'

const QuizResults: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>()
  const { currentAttemptDetails, loading, error, fetchAttemptDetails } = useQuizStore()

  useEffect(() => {
    if (!attemptId) return
    fetchAttemptDetails(attemptId)
  }, [attemptId, fetchAttemptDetails])

  if (loading && !currentAttemptDetails) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <CircularProgress />
    </Box>
  )

  if (error) return <Typography color="error">{error}</Typography>
  if (!currentAttemptDetails) return <Typography>No se encontraron resultados.</Typography>

  const a = currentAttemptDetails

  // Métricas derivadas del intento
  const stats = useMemo(() => {
    const totalQuestions = a.answers.length
    const correct = a.answers.filter(ans => ans.is_correct).length
    const pct = typeof a.percentage === 'number' ? a.percentage : (a.total_points ? Math.round(((a.score || 0) / a.total_points) * 100) : 0)
    return { totalQuestions, correct, pct }
  }, [a])

  // Compatibilidad: a.answers puede venir con ans.question (nuevo) o ans.questions (antiguo)
  type MinimalQ = { question_text?: string; explanation?: string | null }
  const getQuestionFromAnswer = (ans: QuizAttemptWithDetails['answers'][number]): MinimalQ | undefined => {
    const q = (ans as { question?: MinimalQ }).question
    if (q) return q
  const rec = ans as unknown as Record<string, unknown>
    const qs = rec['questions']
    if (qs && typeof qs === 'object') return qs as MinimalQ
    return undefined
  }

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <CardContent>
        {/* Header */}
        <Typography variant="h5" sx={{ mb: 1 }}>Resultados del Quiz</Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>{a.quiz.title}</Typography>

        {/* Resumen retirado: se muestran métricas solo en tarjetas */}

        {/* Grid de estadísticas (CSS Grid) */}
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, mb: 2 }}>
          <Card variant="outlined" sx={{ p: 2, transition: 'box-shadow .2s', '&:hover': { boxShadow: 3 } }}>
            <Typography variant="overline" color="text.secondary">Puntaje total</Typography>
            <Typography variant="h5">{a.score} / {a.total_points}</Typography>
          </Card>
          <Card variant="outlined" sx={{ p: 2, transition: 'box-shadow .2s', '&:hover': { boxShadow: 3 } }}>
            <Typography variant="overline" color="text.secondary">Porcentaje</Typography>
            <Stack spacing={1}>
              <Typography variant="h5">{stats.pct}%</Typography>
              <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, stats.pct))} sx={{ height: 8, borderRadius: 999 }} />
            </Stack>
          </Card>
          <Card variant="outlined" sx={{ p: 2, transition: 'box-shadow .2s', '&:hover': { boxShadow: 3 } }}>
            <Typography variant="overline" color="text.secondary">Correctas</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h5">{stats.correct}</Typography>
              <Typography variant="body1" color="text.secondary">/ {stats.totalQuestions}</Typography>
              <Chip size="small" label={a.passed ? 'Aprobado' : 'Reprobado'} color={a.passed ? 'success' : 'error'} />
            </Stack>
          </Card>
        </Box>

        {/* Mensaje visual */}
        {a.passed ? (
          <Box sx={{ mb: 2 }}>
            <Chip color="success" label="Aprobado" />
          </Box>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Chip color="error" label="Reprobado" />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>Detalle de preguntas</Typography>

        {a.answers.map((ans, idx) => {
          const question = getQuestionFromAnswer(ans)
          return (
            <Card key={ans.id ?? idx} variant="outlined" sx={{ mb: 1.5, borderLeft: 6, borderLeftColor: ans.is_correct ? 'success.main' : 'error.main' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    {ans.selected_option ? (
                      ans.is_correct ? <CheckCircleOutlineIcon color="success" fontSize="small" /> : <HighlightOffIcon color="error" fontSize="small" />
                    ) : (
                      <HelpOutlineIcon color="disabled" fontSize="small" />
                    )}
                    <Chip size="small" variant="outlined" label={idx + 1} />
                    <Typography variant="subtitle1">{question?.question_text}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={ans.is_correct ? 'Correcta' : 'Incorrecta'} color={ans.is_correct ? 'success' : 'error'} />
                    {typeof ans.points_earned === 'number' && (
                      <Chip size="small" label={`Puntos: ${ans.points_earned}`} />
                    )}
                  </Stack>
                </Stack>

                <Typography variant="body2" sx={{ color: ans.is_correct ? 'success.main' : (ans.selected_option ? 'error.main' : 'text.secondary') }}>
                  Tu respuesta: {ans.selected_option ? ans.selected_option.option_text : 'Sin respuesta'}
                </Typography>
                {!ans.is_correct && ans.correct_option && (
                  <Typography variant="body2" color="text.secondary">
                    Respuesta correcta: {ans.correct_option.option_text}
                  </Typography>
                )}

                {question?.explanation && (
                  <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                    Explicación: {question.explanation}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )
        })}

        <Divider sx={{ my: 2 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button component={RouterLink} to={`/quizzes/${a.quiz.id}`} variant="contained" color="primary">Reintentar</Button>
          <Button component={RouterLink} to={'/student/my-courses'} variant="outlined">Volver a Mis Cursos</Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default QuizResults
