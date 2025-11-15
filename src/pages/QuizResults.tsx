import React, { useEffect } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { Box, Card, CardContent, CircularProgress, Divider, Link, Typography, Chip, Stack } from '@mui/material'
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
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 1 }}>Resultados del Quiz</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Puntaje: <b>{a.score}</b> / {a.total_points} — Porcentaje: <b>{a.percentage}%</b> — {a.passed ? 'Aprobado ✅' : 'Reprobado ❌'}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>{a.quiz.title}</Typography>

        {a.answers.map(ans => {
          const question = getQuestionFromAnswer(ans)
          return (
            <Box key={ans.id} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 0.5 }}>{question?.question_text}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Chip size="small" label={ans.is_correct ? 'Correcta' : 'Incorrecta'} color={ans.is_correct ? 'success' : 'error'} />
                {typeof ans.points_earned === 'number' && (
                  <Chip size="small" label={`Puntos: ${ans.points_earned}`} />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Tu respuesta: {ans.selected_option ? ans.selected_option.option_text : 'Sin respuesta'}
              </Typography>
              {!ans.is_correct && ans.correct_option && (
                <Typography variant="body2" color="text.secondary">
                  Respuesta correcta: {ans.correct_option.option_text}
                </Typography>
              )}
              {question?.explanation && (
                <Typography variant="caption" color="text.secondary">Explicación: {question.explanation}</Typography>
              )}
            </Box>
          )
        })}

        <Divider sx={{ my: 2 }} />
  <Link component={RouterLink} to={'/student/my-courses'}>Volver a Mis Cursos</Link>
      </CardContent>
    </Card>
  )
}

export default QuizResults
