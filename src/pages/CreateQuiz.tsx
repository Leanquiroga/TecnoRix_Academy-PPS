import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardContent, TextField, Typography, Paper, IconButton, Container, Stack, Alert } from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import { useQuizStore } from '../store/quiz.store'
import { QuestionType, type CreateQuizInput } from '../types/quiz.types'
import { validateQuizMeta, validateQuestions, buildCreatePayload, enforceSingleCorrect } from '../validation/quizRules'

const CreateQuizPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { createQuiz } = useQuizStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [passingScore, setPassingScore] = useState(70)
  const [timeLimit, setTimeLimit] = useState<number | ''>('')
  const [maxAttempts, setMaxAttempts] = useState<number | ''>('')

  const [questions, setQuestions] = useState([
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
  const [error, setError] = useState<string | null>(null)

  const addQuestion = () => {
    setQuestions(qs => ([...qs, { question_text: '', type: QuestionType.MULTIPLE_CHOICE, points: 1, options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
    ] }]))
  }

  const removeQuestion = (index: number) => setQuestions(qs => qs.filter((_, i) => i !== index))

  const updateQuestion = (index: number, patch: Partial<typeof questions[number]>) => {
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
    if (!courseId) return
    setError(null)

    // Validaciones centralizadas
    const metaError = validateQuizMeta(title, Number(passingScore))
    if (metaError) { setError(metaError); return }
    const questionsError = validateQuestions(questions as any)
    if (questionsError) { setError(questionsError); return }

    const payload: CreateQuizInput = buildCreatePayload({
      courseId,
      title,
      description,
      passingScore: Number(passingScore),
      timeLimit,
      maxAttempts,
    }, questions as any)

    try {
      const quiz = await createQuiz(payload)
      navigate(`/quizzes/${quiz.id}`)
    } catch (err: unknown) {
      // Narrowing de error para evitar any
      let msg = 'No se pudo crear el quiz'
      const hasResponse = (e: unknown): e is { response?: { data?: { error?: unknown } } } =>
        typeof e === 'object' && e !== null && 'response' in (e as Record<string, unknown>)
      const hasMessage = (e: unknown): e is { message: unknown } =>
        typeof e === 'object' && e !== null && 'message' in (e as Record<string, unknown>)

      if (hasResponse(err)) {
        const maybeError = err.response?.data && (err.response.data as Record<string, unknown>)?.error
        if (maybeError != null) msg = String(maybeError)
      } else if (hasMessage(err) && typeof err.message === 'string') {
        msg = err.message
      }
      setError(msg)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>Crear Quiz</Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField fullWidth label="Título" value={title} onChange={e => setTitle(e.target.value)} required />
              <TextField fullWidth label="Descripción" value={description} onChange={e => setDescription(e.target.value)} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField type="number" fullWidth label="Passing Score (%)" value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} required />
                <TextField type="number" fullWidth label="Time Limit (min)" value={timeLimit} onChange={e => setTimeLimit(e.target.value === '' ? '' : Number(e.target.value))} />
                <TextField type="number" fullWidth label="Max Attempts" value={maxAttempts} onChange={e => setMaxAttempts(e.target.value === '' ? '' : Number(e.target.value))} />
              </Stack>

              <Box sx={{ mt: 1 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Preguntas</Typography>
                {questions.map((q, idx) => (
                  <Paper key={idx} sx={{ p: 2, mb: 2 }}>
                    <Stack spacing={1}>
                      <TextField fullWidth label={`Pregunta ${idx + 1}`} value={q.question_text} onChange={e => updateQuestion(idx, { question_text: e.target.value })} required />
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField type="number" label="Puntos" value={q.points} onChange={e => updateQuestion(idx, { points: Number(e.target.value) })} sx={{ maxWidth: 160 }} />
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

              <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained">Crear Quiz</Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default CreateQuizPage
