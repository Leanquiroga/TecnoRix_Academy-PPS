import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material'
import { CheckCircle, Cancel, Refresh } from '@mui/icons-material'
import { useCourse } from '../hooks/useCourse'

export function CourseApproval() {
  const { 
    pendingCourses: courses, 
    loading, 
    error, 
    fetchPendingCourses, 
    approveCourse: approveCourseStore, 
    rejectCourse: rejectCourseStore 
  } = useCourse()
  
  const [success, setSuccess] = useState<string | null>(null)
  
  // Modal de rechazo
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchPendingCourses()
  }, [fetchPendingCourses])

  const handleApprove = async (courseId: string) => {
    try {
      setProcessing(true)
      setSuccess(null)
      
      await approveCourseStore(courseId)
      
      setSuccess('Curso aprobado exitosamente')
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      console.error('Error al aprobar curso:', err)
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectClick = (courseId: string) => {
    setSelectedCourseId(courseId)
    setRejectReason('')
    setRejectError(null)
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedCourseId) return

    if (!rejectReason.trim()) {
      setRejectError('Debes proporcionar una razón para rechazar el curso')
      return
    }

    try {
      setProcessing(true)
      setRejectError(null)
      setSuccess(null)
      
      await rejectCourseStore(selectedCourseId, rejectReason.trim())
      
      setSuccess('Curso rechazado exitosamente')
      
      // Cerrar modal
      setRejectDialogOpen(false)
      setSelectedCourseId(null)
      setRejectReason('')
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setRejectError(message || 'Error al rechazar curso')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectCancel = () => {
    setRejectDialogOpen(false)
    setSelectedCourseId(null)
    setRejectReason('')
    setRejectError(null)
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Aprobación de Cursos
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={fetchPendingCourses}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {courses.length === 0 ? (
        <Alert severity="info">
          No hay cursos pendientes de aprobación
        </Alert>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {course.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {course.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {course.category && (
                    <Chip label={course.category} size="small" />
                  )}
                  {course.level && (
                    <Chip 
                      label={course.level} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  )}
                  {course.price !== undefined && course.price !== null && (
                    <Chip 
                      label={`$${course.price}`} 
                      size="small" 
                      color="secondary" 
                    />
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  ID del curso: {course.id}
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  startIcon={<Cancel />}
                  color="error"
                  onClick={() => handleRejectClick(course.id)}
                  disabled={processing}
                >
                  Rechazar
                </Button>
                <Button
                  startIcon={<CheckCircle />}
                  variant="contained"
                  color="success"
                  onClick={() => handleApprove(course.id)}
                  disabled={processing}
                >
                  Aprobar
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Modal de rechazo */}
      <Dialog 
        open={rejectDialogOpen} 
        onClose={handleRejectCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rechazar Curso</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Por favor, proporciona una razón para rechazar este curso. Esta información será enviada al profesor.
          </Typography>
          
          {rejectError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {rejectError}
            </Alert>
          )}

          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            label="Razón del rechazo"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ej: El contenido no cumple con los estándares de calidad..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectCancel} disabled={processing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRejectConfirm} 
            variant="contained" 
            color="error"
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : 'Confirmar Rechazo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default CourseApproval
