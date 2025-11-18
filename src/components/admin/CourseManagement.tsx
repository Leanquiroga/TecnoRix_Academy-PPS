import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Typography,
  Stack,
  Tooltip,
  TextField,
  Pagination,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material'
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'
import { useCourse } from '../../hooks/useCourse'
import type { Course } from '../../types/course'

interface Props {
  onDataChanged?: () => void
}

export default function CourseManagement({ onDataChanged }: Props) {
  const { 
    pendingCourses: courses, 
    pendingPagination: pagination,
    loading, 
    error, 
    fetchPendingCourses, 
    approveCourse: approveCourseStore, 
    rejectCourse: rejectCourseStore 
  } = useCourse()
  
  const [success, setSuccess] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  
  // Filtros
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  
  // Dialog de rechazo
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean
    course: Course | null
    reason: string
    error: string | null
  }>({
    open: false,
    course: null,
    reason: '',
    error: null,
  })
  
  // Dialog de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    action: () => void
  }>({
    open: false,
    title: '',
    message: '',
    action: () => {},
  })

  // Función para cargar con filtros
  const loadCourses = useCallback((page = 1) => {
    fetchPendingCourses(
      page, 
      20, 
      searchText || undefined,
      categoryFilter || undefined,
      levelFilter || undefined
    )
  }, [fetchPendingCourses, searchText, categoryFilter, levelFilter])

  // Cargar cursos al montar y cuando cambien los filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCourses(1)
    }, searchText ? 500 : 0) // Debounce de 500ms para búsqueda

    return () => clearTimeout(timer)
  }, [searchText, categoryFilter, levelFilter, loadCourses])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    loadCourses(page)
  }

  const handleRefresh = () => {
    loadCourses(pagination.page)
    onDataChanged?.()
  }

  const handleClearFilters = () => {
    setSearchText('')
    setCategoryFilter('')
    setLevelFilter('')
  }

  const handleApprove = async (course: Course) => {
    try {
      setProcessing(true)
      setSuccess(null)
      await approveCourseStore(course.id)
      setSuccess(`Curso "${course.title}" aprobado exitosamente`)
      onDataChanged?.()
      // Si la página actual queda vacía, ir a la anterior
      if (courses.length === 1 && pagination.page > 1) {
        loadCourses(pagination.page - 1)
      } else {
        loadCourses(pagination.page)
      }
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error al aprobar curso:', err)
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectClick = (course: Course) => {
    setRejectDialog({
      open: true,
      course,
      reason: '',
      error: null,
    })
  }

  const handleRejectConfirm = async () => {
    if (!rejectDialog.course) return

    if (!rejectDialog.reason.trim()) {
      setRejectDialog({ ...rejectDialog, error: 'Debes proporcionar una razón para rechazar el curso' })
      return
    }

    try {
      setProcessing(true)
      setRejectDialog({ ...rejectDialog, error: null })
      setSuccess(null)
      
      await rejectCourseStore(rejectDialog.course.id, rejectDialog.reason.trim())
      
      setSuccess(`Curso "${rejectDialog.course.title}" rechazado exitosamente`)
      setRejectDialog({ open: false, course: null, reason: '', error: null })
      onDataChanged?.()
      
      // Si la página actual queda vacía, ir a la anterior
      if (courses.length === 1 && pagination.page > 1) {
        loadCourses(pagination.page - 1)
      } else {
        loadCourses(pagination.page)
      }
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setRejectDialog({ ...rejectDialog, error: message || 'Error al rechazar curso' })
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectCancel = () => {
    setRejectDialog({ open: false, course: null, reason: '', error: null })
  }

  const openConfirmDialog = (title: string, message: string, action: () => void) => {
    setConfirmDialog({ open: true, title, message, action })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, title: '', message: '', action: () => {} })
  }

  const executeAction = () => {
    confirmDialog.action()
    closeConfirmDialog()
  }

  const getLevelColor = (level?: string | null) => {
    switch (level) {
      case 'beginner':
        return 'success'
      case 'intermediate':
        return 'warning'
      case 'advanced':
        return 'error'
      default:
        return 'default'
    }
  }

  const getLevelLabel = (level?: string | null) => {
    switch (level) {
      case 'beginner':
        return 'Principiante'
      case 'intermediate':
        return 'Intermedio'
      case 'advanced':
        return 'Avanzado'
      default:
        return 'N/A'
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Gestión de Cursos Pendientes
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Mostrando {courses.length} de {pagination.total} curso{pagination.total !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          variant="outlined"
          disabled={loading}
        >
          Actualizar
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Filtros de búsqueda */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            placeholder="Buscar por título o descripción..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchText && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchText('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            disabled={loading}
          />
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Filtrar por Categoría</InputLabel>
              <Select
                value={categoryFilter}
                label="Filtrar por Categoría"
                onChange={(e) => setCategoryFilter(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="">Todas las categorías</MenuItem>
                <MenuItem value="Programación">Programación</MenuItem>
                <MenuItem value="Diseño">Diseño</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Negocios">Negocios</MenuItem>
                <MenuItem value="Idiomas">Idiomas</MenuItem>
                <MenuItem value="Ciencia">Ciencia</MenuItem>
                <MenuItem value="Otros">Otros</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Filtrar por Nivel</InputLabel>
              <Select
                value={levelFilter}
                label="Filtrar por Nivel"
                onChange={(e) => setLevelFilter(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="">Todos los niveles</MenuItem>
                <MenuItem value="beginner">Principiante</MenuItem>
                <MenuItem value="intermediate">Intermedio</MenuItem>
                <MenuItem value="advanced">Avanzado</MenuItem>
              </Select>
            </FormControl>

            {(searchText || categoryFilter || levelFilter) && (
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                disabled={loading}
                sx={{ minWidth: { sm: 150 } }}
              >
                Limpiar Filtros
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Tabla de cursos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={80}><strong>Portada</strong></TableCell>
              <TableCell><strong>Título</strong></TableCell>
              <TableCell><strong>Descripción</strong></TableCell>
              <TableCell><strong>Categoría</strong></TableCell>
              <TableCell><strong>Nivel</strong></TableCell>
              <TableCell><strong>Precio</strong></TableCell>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell align="center" width={150}><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {pagination.total === 0 
                      ? 'No hay cursos pendientes de aprobación' 
                      : 'No hay cursos en esta página'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id} hover>
                  <TableCell>
                    {course.thumbnail_url ? (
                      <Avatar
                        src={course.thumbnail_url}
                        alt={course.title}
                        variant="rounded"
                        sx={{ width: 60, height: 40 }}
                      />
                    ) : (
                      <Avatar
                        variant="rounded"
                        sx={{ width: 60, height: 40, bgcolor: 'action.hover' }}
                      >
                        <ImageIcon fontSize="small" />
                      </Avatar>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {course.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {course.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {course.category ? (
                      <Chip label={course.category} size="small" />
                    ) : (
                      <Typography variant="body2" color="text.disabled">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getLevelLabel(course.level)}
                      color={getLevelColor(course.level)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {course.price !== undefined && course.price !== null ? (
                      <Chip 
                        label={`$${course.price}`} 
                        size="small" 
                        color="secondary"
                      />
                    ) : (
                      <Chip label="Gratis" size="small" color="success" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(course.created_at).toLocaleDateString('es-ES')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Aprobar curso">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() =>
                            openConfirmDialog(
                              'Aprobar Curso',
                              `¿Estás seguro de aprobar el curso "${course.title}"?`,
                              () => handleApprove(course)
                            )
                          }
                          disabled={processing}
                        >
                          <ApproveIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Rechazar curso">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRejectClick(course)}
                          disabled={processing}
                        >
                          <RejectIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            disabled={loading}
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Dialog: Rechazar Curso */}
      <Dialog 
        open={rejectDialog.open} 
        onClose={handleRejectCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rechazar Curso</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Curso: <strong>{rejectDialog.course?.title}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Por favor, proporciona una razón para rechazar este curso. Esta información será enviada al profesor.
          </Typography>
          
          {rejectDialog.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {rejectDialog.error}
            </Alert>
          )}

          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            label="Razón del rechazo"
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
            placeholder="Ej: El contenido no cumple con los estándares de calidad..."
            required
            disabled={processing}
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

      {/* Dialog: Confirmación */}
      <Dialog open={confirmDialog.open} onClose={closeConfirmDialog}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog} disabled={processing}>
            Cancelar
          </Button>
          <Button 
            onClick={executeAction} 
            variant="contained" 
            color="primary" 
            autoFocus
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
