import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography, Breadcrumbs, Link, Alert } from '@mui/material'
import { useQuizStore } from '../store/quiz.store'
import QuizQuestion from '../components/quiz/QuizQuestion'
import QuizProgress from '../components/quiz/QuizProgress'
import QuizTimer from '../components/quiz/QuizTimer'
import { useEnrollmentStore } from '../store/enrollment.store'

const QuizView: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const {
    currentQuiz,
    currentAttempt,
    tempAnswers,
    loading,
    error,
    loadQuiz,
    startAttempt,
    selectAnswer,
    submitAttempt,
    currentAttemptDetails,
  } = useQuizStore()
  const { myCourses } = useEnrollmentStore()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [startError, setStartError] = useState<string | null>(null)

  // Determina si hay cambios no enviados
  const hasChanges = useMemo(() => {
    const answered = Object.keys(tempAnswers || {}).length > 0
    return answered && !currentAttemptDetails
  }, [tempAnswers, currentAttemptDetails])

  // Advertir si el usuario cierra/recarga la pestaña
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasChanges) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasChanges])

  useEffect(() => {
    if (!quizId) return
    // Cargar el quiz (no iniciar intento automáticamente)
    ;(async () => {
      try {
        await loadQuiz(quizId)
        setCurrentIndex(0)
      } catch {
        // el store ya maneja error
      }
    })()
  }, [quizId, loadQuiz])

  const isEnrolled = useMemo(() => {
    if (!currentQuiz) return false
    return myCourses.some((e) => e.course_id === currentQuiz.course_id)
  }, [myCourses, currentQuiz])

  const handlePrev = () => setCurrentIndex((i) => Math.max(0, i - 1))
  const handleNext = () => setCurrentIndex((i) => Math.min((currentQuiz?.questions.length || 1) - 1, i + 1))
  const handleStart = async () => {
    if (!quizId) return
    setStartError(null)
    try {
      await startAttempt(quizId)
      setCurrentIndex(0)
    } catch (e: any) {
      const message = e?.response?.data?.error || e?.message || 'No se pudo iniciar el intento'
      setStartError(message)
    }
  }
  const handleSubmit = async () => {
    await submitAttempt()
    // Redirigir a resultados usando el intento actual (actualizado por submit)
    const attemptId = useQuizStore.getState().currentAttemptDetails?.id || useQuizStore.getState().currentAttempt?.id
    if (attemptId) navigate(`/quiz-attempts/${attemptId}`)
  }

  const handleExit = () => {
    if (hasChanges) {
      const ok = window.confirm('Tienes respuestas sin enviar. ¿Seguro que deseas salir? Perderás el progreso no enviado.')
      if (!ok) return
    }
    const courseId = currentQuiz?.course_id
    if (courseId) {
      navigate(`/student/courses/${courseId}`)
    } else {
      navigate(-1)
    }
  }

  if (loading && !currentQuiz) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <CircularProgress />
    </Box>
  )

  if (error) return <Typography color="error">{error}</Typography>
  if (!currentQuiz) return <Typography>No se encontró el quiz.</Typography>

  const q = currentQuiz.questions[currentIndex]
  const value = tempAnswers[q.id]

  return (
    <Card>
      <CardContent>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
          <Link component={RouterLink} color="inherit" to="/courses">Cursos</Link>
          {currentQuiz?.course_id ? (
            <Link component={RouterLink} color="inherit" to={`/student/courses/${currentQuiz.course_id}`}>Curso</Link>
          ) : null}
          <Typography color="text.primary">Quiz</Typography>
        </Breadcrumbs>
        <Typography variant="h5" sx={{ mb: 1 }}>{currentQuiz.title}</Typography>

        {/* Estado previo al inicio del intento */}
        {!currentAttempt ? (
          <>
            {startError && (
              <Alert severity="error" sx={{ mb: 2 }}>{startError}</Alert>
            )}
            {!isEnrolled && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Debes estar inscrito en el curso para tomar este quiz.
                <Button size="small" sx={{ ml: 2 }} onClick={() => navigate(`/student/courses/${currentQuiz.course_id}`)}>
                  Ir al curso
                </Button>
              </Alert>
            )}
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {currentQuiz.questions.length} preguntas · Aprobación {currentQuiz.passing_score}% · {currentQuiz.time_limit_minutes ? `${currentQuiz.time_limit_minutes} min` : 'Sin límite de tiempo'}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="text" color="inherit" onClick={handleExit}>Volver</Button>
              <Button variant="contained" onClick={handleStart} disabled={!isEnrolled}>Comenzar intento</Button>
            </Stack>
          </>
        ) : (
          <>
            {currentQuiz.time_limit_minutes ? (
              <QuizTimer minutes={currentQuiz.time_limit_minutes} onTimeUp={handleSubmit} />
            ) : null}

            <QuizProgress current={currentIndex} total={currentQuiz.questions.length} />

            <Box sx={{ my: 2 }}>
              <QuizQuestion
                question={q}
                value={value}
                onChange={(val) => selectAnswer(q.id, val)}
              />
            </Box>

            <Stack direction="row" spacing={2} justifyContent="space-between">
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={handlePrev} disabled={currentIndex === 0}>Anterior</Button>
                <Button variant="text" color="error" onClick={handleExit}>Salir</Button>
              </Stack>
              {currentIndex < currentQuiz.questions.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>Siguiente</Button>
              ) : (
                <Button variant="contained" color="primary" onClick={handleSubmit}>Enviar Quiz</Button>
              )}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default QuizView
