import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Card, CardContent, Typography, Stack, TextField, Button, Alert, Paper, IconButton, Box } from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import { useQuizStore } from '../store/quiz.store'
import { QuestionType, type UpdateQuizInput } from '../types/quiz.types'
import { validateQuizMeta, validateQuestions, enforceSingleCorrect } from '../validation/quizRules'
import { useNotify } from '../hooks/useNotify'

export default function EditQuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const notify = useNotify()
  const { currentQuiz, loadQuiz, updateQuiz, replaceQuestions, loading, error, clearError } = useQuizStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [passingScore, setPassingScore] = useState<number>(70)
  const [timeLimit, setTimeLimit] = useState<number | ''>('')
  const [maxAttempts, setMaxAttempts] = useState<number | ''>('')
  const [orderIndex, setOrderIndex] = useState<number | ''>('')
  const [formError, setFormError] = useState<string | null>(null)
  // Eliminado bloqueo por intentos: ya no se restringe edición de preguntas
  type EditableQuestion = {
    question_text: string
    type: QuestionType
    points: number
    options: { option_text: string; is_correct: boolean }[]
  }
  const [questions, setQuestions] = useState<EditableQuestion[]>([
    {
      question_text: '',
      type: QuestionType.MULTIPLE_CHOICE,
      points: 1,
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
      ],
    },
  ])

  useEffect(() => {
    if (!quizId) return
    ;(async () => {
      try {
        await loadQuiz(quizId)
      } catch {}
    })()
  }, [quizId, loadQuiz])

  useEffect(() => {
    if (!currentQuiz) return
    setTitle(currentQuiz.title)
    setDescription(currentQuiz.description || '')
    setPassingScore(currentQuiz.passing_score)
    setTimeLimit(currentQuiz.time_limit_minutes ?? '')
    setMaxAttempts(currentQuiz.max_attempts ?? '')
    setOrderIndex(currentQuiz.order_index ?? '')
    if (currentQuiz.questions && currentQuiz.questions.length > 0) {
      const mapped: EditableQuestion[] = currentQuiz.questions.map((q) => ({
        question_text: q.question_text,
        type: q.type as QuestionType,
        points: q.points,
        options: q.options.map((o) => ({ option_text: o.option_text, is_correct: (o as any).is_correct === true }))
      }))
      setQuestions(mapped)
    }
  }, [currentQuiz])

  const addQuestion = () => {
    setQuestions(qs => ([...qs, { question_text: '', type: QuestionType.MULTIPLE_CHOICE, points: 1, options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
    ] }]))
  }

  const removeQuestion = (index: number) => setQuestions(qs => qs.filter((_, i) => i !== index))

  const updateQuestionLocal = (index: number, patch: Partial<typeof questions[number]>) => {
    setQuestions(qs => qs.map((q, i) => i === index ? { ...q, ...patch } : q))
  }

  const updateOption = (qIdx: number, oIdx: number, patch: Partial<{ option_text: string; is_correct: boolean }>) => {
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q
      let opts = q.options.map((o, j) => j === oIdx ? { ...o, ...patch } : o)
      if (patch.is_correct && (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE)) {
        opts = enforceSingleCorrect(opts, oIdx)
      }
      return { ...q, options: opts }
    }))
  }

  const addOption = (qIdx: number) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, options: [...q.options, { option_text: '', is_correct: false }] } : q))
  }

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, options: q.options.filter((_, j) => j !== oIdx) } : q))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const metaError = validateQuizMeta(title, Number(passingScore))
    if (metaError) { setFormError(metaError); return }

    const payload: UpdateQuizInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      passing_score: Number(passingScore),
      time_limit_minutes: timeLimit === '' ? undefined : Number(timeLimit),
      max_attempts: maxAttempts === '' ? undefined : Number(maxAttempts),
      order_index: orderIndex === '' ? undefined : Number(orderIndex),
    }

    // Validaciones de preguntas (siempre permitidas)
    const questionsError = validateQuestions(questions as any)
    if (questionsError) { setFormError(questionsError); return }

    try {
      if (!quizId) return
      await updateQuiz(quizId, payload)
      const preparedQuestions = questions.map((q, idx) => ({
        question_text: q.question_text,
        type: q.type,
        points: q.points,
        order_index: idx + 1,
        options: q.options.map((o, j) => ({ option_text: o.option_text, is_correct: o.is_correct, order_index: j + 1 })),
      }))
      await replaceQuestions(quizId, preparedQuestions)
      notify({ title: 'Quiz actualizado', message: 'Se guardaron los cambios y preguntas', severity: 'success' })
      const courseId = useQuizStore.getState().currentQuiz?.course_id
      if (courseId) {
        navigate(`/teacher/courses/${courseId}/quizzes`)
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'No se pudo actualizar el quiz o sus preguntas'
      setFormError(msg)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>Editar Quiz</Typography>
          {error && (
            <Alert severity="error" onClose={() => clearError()} sx={{ mb: 2 }}>{error}</Alert>
          )}
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
          )}
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField label="Título" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} required />
              <TextField label="Descripción" fullWidth multiline minRows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField type="number" label="Aprobación (%)" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} required />
                <TextField type="number" label="Tiempo (min)" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value === '' ? '' : Number(e.target.value))} />
                <TextField type="number" label="Intentos Máximos" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value === '' ? '' : Number(e.target.value))} />
                <TextField type="number" label="Orden" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value === '' ? '' : Number(e.target.value))} />
              </Stack>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Preguntas</Typography>
                {questions.map((q, idx) => (
                  <Paper key={idx} sx={{ p: 2, mb: 2 }}>
                    <Stack spacing={1}>
                      <TextField fullWidth label={`Pregunta ${idx + 1}`} value={q.question_text} onChange={e => updateQuestionLocal(idx, { question_text: e.target.value })} required />
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField type="number" label="Puntos" value={q.points} onChange={e => updateQuestionLocal(idx, { points: Number(e.target.value) })} sx={{ maxWidth: 160 }} />
                        <IconButton aria-label="Eliminar pregunta" color="error" onClick={() => removeQuestion(idx)} disabled={questions.length <= 1}>
                          <Delete />
                        </IconButton>
                      </Stack>
                      <Typography variant="subtitle2" sx={{ mt: 1 }}>Opciones</Typography>
                      {q.options.map((o, j) => (
                        <Stack direction="row" spacing={1} alignItems="center" key={j}>
                          <TextField fullWidth size="small" label={`Opción ${j + 1}`} value={o.option_text} onChange={e => updateOption(idx, j, { option_text: e.target.value })} />
                          <Button variant={o.is_correct ? 'contained' : 'outlined'} color="success" onClick={() => updateOption(idx, j, { is_correct: true })}>
                            Correcta
                          </Button>
                          <IconButton aria-label="Eliminar opción" color="error" onClick={() => removeOption(idx, j)} disabled={q.options.length <= 2}>
                            <Delete />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button startIcon={<Add />} onClick={() => addOption(idx)}>Agregar opción</Button>
                    </Stack>
                  </Paper>
                ))}
                <Button startIcon={<Add />} onClick={addQuestion}>Agregar pregunta</Button>
              </Box>

              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Button type="submit" variant="contained" disabled={loading}>Guardar</Button>
                <Button variant="outlined" onClick={() => navigate(-1)}>Cancelar</Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Container>
  )
}
