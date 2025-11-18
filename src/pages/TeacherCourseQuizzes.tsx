import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import { useQuizStore } from '../store/quiz.store'
import { ROUTES } from '../routes/routes.config'
import { useNotify } from '../hooks/useNotify'

export default function TeacherCourseQuizzes() {
  const { id: courseId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const notify = useNotify()
  const { loadQuizzesByCourse, quizzesByCourse, deleteQuiz, loading, error, clearError } = useQuizStore()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) return
    ;(async () => {
      try {
        await loadQuizzesByCourse(courseId)
      } catch {
        // error handled by store
      }
    })()
  }, [courseId, loadQuizzesByCourse])

  const quizzes = courseId ? (quizzesByCourse[courseId] || []) : []

  const handleEdit = (quizId: string) => {
    navigate(ROUTES.TEACHER.QUIZ_EDIT(quizId))
  }

  const handleDelete = async () => {
    if (!confirmId || !courseId) return
    try {
      await deleteQuiz(confirmId)
      notify({ title: 'Quiz eliminado', message: 'El quiz fue eliminado correctamente', severity: 'success' })
      await loadQuizzesByCourse(courseId)
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'No se pudo eliminar el quiz'
      notify({ title: 'No se pudo eliminar', message: msg, severity: 'error' })
    } finally {
      setConfirmId(null)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Quizzes del curso</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate(-1)}>Volver</Button>
        </Stack>
      </Stack>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={160}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" onClose={() => clearError()} sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Paper>
        {quizzes.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography variant="body2" color="text.secondary">Este curso aún no tiene quizzes.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Título</strong></TableCell>
                  <TableCell><strong>Descripción</strong></TableCell>
                  <TableCell align="center"><strong>Aprobación</strong></TableCell>
                  <TableCell align="center"><strong>Tiempo</strong></TableCell>
                  <TableCell align="center"><strong>Intentos</strong></TableCell>
                  <TableCell align="right"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quizzes.map((q) => (
                  <TableRow key={q.id} hover>
                    <TableCell>{q.title}</TableCell>
                    <TableCell>{q.description}</TableCell>
                    <TableCell align="center">{q.passing_score}%</TableCell>
                    <TableCell align="center">{q.time_limit_minutes ?? '—'}</TableCell>
                    <TableCell align="center">{q.max_attempts ?? '—'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => handleEdit(q.id)}>Editar</Button>
                        <Button size="small" color="error" variant="contained" onClick={() => setConfirmId(q.id)}>Eliminar</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={!!confirmId} onClose={() => setConfirmId(null)}>
        <DialogTitle>Eliminar quiz</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro que deseas eliminar este quiz? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
