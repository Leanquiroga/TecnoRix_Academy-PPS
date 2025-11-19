import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Typography,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Pagination,
} from '@mui/material'
import {
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'
import { type TeacherApplication } from '../../api/teacher.service'
import { useUser } from '../../hooks/useUser'
import TeacherApplicationModal from './TeacherApplicationModal.js'

interface Props {
  onDataChanged?: () => void
}

type StatusFilter = 'all' | 'pending_validation' | 'active' | 'rejected' | 'suspended'

export default function TeacherApplicationsList({ onDataChanged }: Props) {
  const {
    applications,
    applicationsStatusFilter,
    loading,
    error,
    success,
    setApplicationsStatusFilter,
    fetchTeacherApplications,
    clearError,
    clearSuccess,
  } = useUser()
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(applicationsStatusFilter as StatusFilter)
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20
  
  // Modal state
  const [selectedApplication, setSelectedApplication] = useState<TeacherApplication | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadApplications = useCallback(async () => {
    setApplicationsStatusFilter(statusFilter)
    await fetchTeacherApplications(statusFilter)
  }, [statusFilter, fetchTeacherApplications, setApplicationsStatusFilter])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  // Auto clear de mensajes de éxito tras 3s
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => clearSuccess(), 3000)
      return () => clearTimeout(t)
    }
  }, [success, clearSuccess])

  const handleViewDetails = (application: TeacherApplication) => {
    setSelectedApplication(application)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedApplication(null)
  }

  const handleApplicationUpdated = async (_message: string, shouldClose: boolean = true) => {
    // success se gestiona por fuera; mostrar mensaje usando clearSuccess/temporizador
    await loadApplications()
    onDataChanged?.()
    if (!shouldClose && selectedApplication) {
      // refrescar selectedApplication desde store
      const updatedApplication = applications.find(app => app.user_id === selectedApplication.user_id)
      if (updatedApplication) setSelectedApplication(updatedApplication)
    }
    if (shouldClose) handleCloseModal()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'rejected':
        return 'error'
      case 'pending_validation':
        return 'warning'
      case 'suspended':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aprobado'
      case 'rejected':
        return 'Rechazado'
      case 'pending_validation':
        return 'Pendiente'
      case 'suspended':
        return 'Suspendido'
      default:
        return status
    }
  }

  const getPendingCredentialsCount = (application: TeacherApplication) => {
    if (!application.credentials) return 0
    return application.credentials.filter(c => c.verification_status === 'pending').length
  }

  const filteredApplications = useMemo(() => {
    if (!searchText.trim()) return applications
    const q = searchText.toLowerCase()
    return applications.filter(app => (
      (app.name && app.name.toLowerCase().includes(q)) ||
      (app.email && app.email.toLowerCase().includes(q)) ||
      (app.profile?.headline && app.profile.headline.toLowerCase().includes(q))
    ))
  }, [applications, searchText])

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / limit))
  const currentPageApplications = useMemo(() => {
    const start = (page - 1) * limit
    return filteredApplications.slice(start, start + limit)
  }, [filteredApplications, page])

  // Reset página al cambiar filtros/búsqueda
  useEffect(() => {
    setPage(1)
  }, [searchText, statusFilter])

  const renderTableContent = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
            <CircularProgress />
          </TableCell>
        </TableRow>
      )
    }

    if (filteredApplications.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
            <Typography color="text.secondary">
              No hay aplicaciones {statusFilter !== 'all' && `con estado "${getStatusLabel(statusFilter)}"`}
            </Typography>
          </TableCell>
        </TableRow>
      )
    }

    return currentPageApplications.map((application, index) => (
      <TableRow key={`${application.user_id}-${index}`} hover>
        <TableCell>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar 
              src={application.profile?.photo_url} 
              alt={application.name || 'Usuario'}
              sx={{ width: 40, height: 40 }}
            >
              {application.name ? application.name.charAt(0).toUpperCase() : '?'}
            </Avatar>
            <Typography variant="body2" fontWeight="medium">
              {application.name || 'Sin nombre'}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {application.email || '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
            {application.profile?.headline || '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {application.profile?.years_experience 
              ? `${application.profile.years_experience} años`
              : '—'
            }
          </Typography>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="body2">
              {application.credentials?.length || 0}
            </Typography>
            {getPendingCredentialsCount(application) > 0 && (
              <Chip 
                label={`${getPendingCredentialsCount(application)} pendientes`}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>
        </TableCell>
        <TableCell>
          <Chip
            label={getStatusLabel(application.status)}
            color={getStatusColor(application.status)}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {new Date(application.created_at).toLocaleDateString('es-ES')}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Tooltip title="Ver detalles y revisar">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleViewDetails(application)}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Aplicaciones de Profesores
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Mostrando {currentPageApplications.length} de {filteredApplications.length} aplicacion{filteredApplications.length !== 1 ? 'es' : ''}
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => { loadApplications(); onDataChanged?.() }}
          variant="outlined"
          disabled={loading}
        >
          Actualizar
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => clearError()} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => clearSuccess()} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, email o titular..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchText && (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Limpiar búsqueda" onClick={() => setSearchText('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Filtrar por Estado"
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                disabled={loading}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pending_validation">Pendientes</MenuItem>
                <MenuItem value="active">Aprobados</MenuItem>
                <MenuItem value="rejected">Rechazados</MenuItem>
              </Select>
            </FormControl>
            {(searchText || statusFilter !== 'all') && (
              <Button
                variant="outlined"
                onClick={() => { setSearchText(''); setStatusFilter('all'); loadApplications() }}
                disabled={loading}
                sx={{ minWidth: { sm: 160 } }}
              >
                Limpiar filtros
              </Button>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              Total: <strong>{applications.length}</strong>
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* Tabla de aplicaciones */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Profesor</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Especialidad</strong></TableCell>
              <TableCell><strong>Experiencia</strong></TableCell>
              <TableCell><strong>Credenciales</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderTableContent()}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_e: React.ChangeEvent<unknown>, p: number) => setPage(p)}
            color="primary"
            showFirstButton
            showLastButton
            disabled={loading}
          />
        </Box>
      )}

      {/* Modal de detalles */}
      {selectedApplication && (
        <TeacherApplicationModal
          open={modalOpen}
          application={selectedApplication}
          onClose={handleCloseModal}
          onApplicationUpdated={handleApplicationUpdated}
        />
      )}
    </Box>
  )
}
